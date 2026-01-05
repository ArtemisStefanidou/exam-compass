import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { AppRole } from '@/lib/auth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [needsRole, setNeedsRole] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        setError('Αποτυχία σύνδεσης. Παρακαλώ δοκιμάστε ξανά.');
        return;
      }

      if (!session?.user) {
        setError('Δεν βρέθηκε χρήστης.');
        return;
      }

      const userEmail = session.user.email;
      
      // Validate hua.gr domain
      if (!userEmail?.endsWith('@hua.gr')) {
        await supabase.auth.signOut();
        setError('Παρακαλώ χρησιμοποιήστε το ακαδημαϊκό σας email (@hua.gr)');
        return;
      }

      // Check if user already has a role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (roleData) {
        // User has role, redirect to dashboard
        navigate('/dashboard');
      } else {
        // User needs to select role
        setUserId(session.user.id);
        setNeedsRole(true);
      }
    } catch (err) {
      console.error('Auth callback error:', err);
      setError('Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.');
    }
  };

  const assignRole = async (selectedRole: AppRole) => {
    if (!userId) return;
    
    setIsAssigning(true);
    
    try {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: selectedRole });

      if (roleError) {
        console.error('Role assignment error:', roleError);
        setError('Αποτυχία ανάθεσης ρόλου. Παρακαλώ δοκιμάστε ξανά.');
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Error assigning role:', err);
      setError('Κάτι πήγε στραβά. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      setIsAssigning(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-card">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="w-12 h-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Σφάλμα Σύνδεσης</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => navigate('/auth')}>
                Επιστροφή στη Σύνδεση
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (needsRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-card">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-serif font-bold text-foreground mb-2">
                Επιλέξτε τον Ρόλο σας
              </h2>
              <p className="text-muted-foreground">
                Είστε Γραμματεία ή Υποψήφιος Διδάκτορας;
              </p>
            </div>
            
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full h-16 text-left justify-start"
                onClick={() => assignRole('phd_student')}
                disabled={isAssigning}
              >
                <div>
                  <p className="font-semibold">Υποψήφιος Διδάκτορας</p>
                  <p className="text-sm text-muted-foreground">Δήλωση διαθεσιμότητας για επιτηρήσεις</p>
                </div>
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full h-16 text-left justify-start"
                onClick={() => assignRole('secretary')}
                disabled={isAssigning}
              >
                <div>
                  <p className="font-semibold">Γραμματεία</p>
                  <p className="text-sm text-muted-foreground">Διαχείριση μαθημάτων και εξετάσεων</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Σύνδεση σε εξέλιξη...</p>
      </div>
    </div>
  );
}