import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'secretary' | 'phd_student';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInDemo: (demoRole: AppRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo account credentials
const DEMO_ACCOUNTS = {
  secretary: {
    email: 'demo.secretary@hua.gr',
    password: 'demo123456'
  },
  phd_student: {
    email: 'demo.phd@hua.gr', 
    password: 'demo123456'
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setRole(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching role:', error);
        return;
      }

      if (data) {
        setRole(data.role as AppRole);
      }
    } catch (err) {
      console.error('Error in fetchUserRole:', err);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          hd: 'hua.gr',
        },
      },
    });
    return { error: error as Error | null };
  };

  const signInDemo = async (demoRole: AppRole) => {
    const account = DEMO_ACCOUNTS[demoRole];
    
    // Try to sign in first
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: account.email,
      password: account.password,
    });

    if (signInError) {
      // If user doesn't exist, create it
      if (signInError.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: account.email,
          password: account.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: demoRole === 'secretary' ? 'Demo Γραμματεία' : 'Demo Διδακτορικός',
            },
          },
        });

        if (signUpError) {
          return { error: signUpError as Error };
        }

        // Assign role
        if (signUpData.user) {
          await supabase.from('user_roles').insert({ 
            user_id: signUpData.user.id, 
            role: demoRole 
          });
          
          // If PhD student, link to demo professor
          if (demoRole === 'phd_student') {
            await supabase.from('phd_supervisor_links').insert({
              user_id: signUpData.user.id,
              professor_id: '11111111-1111-1111-1111-111111111111' // Demo professor
            });
          }
          
          setRole(demoRole);
        }

        return { error: null };
      }
      return { error: signInError as Error };
    }

    // User exists - fetch their role from database
    if (data.user) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle();
      
      if (roleData) {
        setRole(roleData.role as AppRole);
      } else {
        // Role doesn't exist, create it
        await supabase.from('user_roles').upsert({ 
          user_id: data.user.id, 
          role: demoRole 
        }, { onConflict: 'user_id' });
        setRole(demoRole);
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signInWithGoogle, signInDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
