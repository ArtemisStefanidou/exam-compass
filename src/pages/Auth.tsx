import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Loader2, AlertCircle } from 'lucide-react';

export default function Auth() {
  const navigate = useNavigate();
  const { user, signInWithGoogle, loading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
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
    // Note: Don't setIsLoading(false) on success - redirect happens automatically
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
            
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Σύνδεση
              </h2>
              <p className="text-sm text-muted-foreground">
                Χρησιμοποιήστε τον ακαδημαϊκό σας λογαριασμό @hua.gr
              </p>
            </div>
            
            <Button 
              onClick={handleGoogleSignIn} 
              className="w-full h-12 text-base"
              disabled={isLoading}
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
            
            <p className="text-xs text-muted-foreground text-center mt-6">
              Μόνο λογαριασμοί @hua.gr επιτρέπονται
            </p>
          </CardContent>
        </Card>
        
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Γραμματεία ή Υποψήφιοι Διδάκτορες
          </p>
        </div>
      </div>
    </div>
  );
}