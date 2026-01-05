import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { GraduationCap, Loader2, AlertCircle, Users, BookOpen } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const { user, signInWithGoogle, signInDemo, loading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<'secretary' | 'phd_student' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    
    const { error } = await signInWithGoogle();
    
    if (error) {
      setError('Αποτυχία σύνδεσης με Google. Παρακαλώ δοκιμάστε ξανά.');
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'secretary' | 'phd_student') => {
    setError(null);
    setDemoLoading(role);
    
    const { error } = await signInDemo(role);
    
    if (error) {
      setError('Αποτυχία σύνδεσης demo. Παρακαλώ δοκιμάστε ξανά.');
      setDemoLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-hero shadow-elevated mb-4">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            ExamGuard
          </h1>
          <p className="text-muted-foreground mt-2">
            Σύστημα Επιτηρήσεων Εξετάσεων
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Χαροκόπειο Πανεπιστήμιο
          </p>
        </div>

        <Card className="shadow-card border-border/50">
          <CardContent className="pt-6 pb-8 px-8">
            {error && (
              <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            
            {/* Demo Login Section */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-2 text-center">
                Δοκιμαστική Είσοδος
              </h2>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Δοκιμάστε την εφαρμογή χωρίς λογαριασμό
              </p>
              
              <div className="space-y-3">
                <Button 
                  variant="outline"
                  onClick={() => handleDemoLogin('secretary')} 
                  className="w-full h-14 justify-start px-4"
                  disabled={demoLoading !== null || isLoading}
                >
                  {demoLoading === 'secretary' ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mr-3">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-medium">Είσοδος ως Γραμματεία</p>
                    <p className="text-xs text-muted-foreground">Διαχείριση μαθημάτων & εξετάσεων</p>
                  </div>
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => handleDemoLogin('phd_student')} 
                  className="w-full h-14 justify-start px-4"
                  disabled={demoLoading !== null || isLoading}
                >
                  {demoLoading === 'phd_student' ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center mr-3">
                      <BookOpen className="w-5 h-5 text-accent" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="font-medium">Είσοδος ως Διδακτορικός</p>
                    <p className="text-xs text-muted-foreground">Δήλωση διαθεσιμότητας επιτήρησης</p>
                  </div>
                </Button>
              </div>
            </div>
            
            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
                ή
              </span>
            </div>
            
            {/* Google Login */}
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Σύνδεση με ακαδημαϊκό λογαριασμό
              </p>
            </div>
            
            <Button 
              onClick={handleGoogleSignIn} 
              className="w-full h-12 text-base"
              disabled={isLoading || demoLoading !== null}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Σύνδεση με Google (@hua.gr)
            </Button>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              Μόνο λογαριασμοί @hua.gr επιτρέπονται
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}