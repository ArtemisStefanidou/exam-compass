import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  GraduationCap, 
  Star, 
  Save,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

interface Professor {
  id: string;
  full_name: string;
  department: string | null;
  email: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [selectedSupervisors, setSelectedSupervisors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoadingData(true);
    
    // Fetch all professors
    const { data: profsData } = await supabase
      .from('professors')
      .select('*')
      .order('full_name');

    if (profsData) {
      setProfessors(profsData);
    }

    // Fetch current supervisor links
    if (user) {
      const { data: linksData } = await supabase
        .from('phd_supervisor_links')
        .select('professor_id')
        .eq('user_id', user.id);

      if (linksData) {
        setSelectedSupervisors(linksData.map((l) => l.professor_id));
      }
    }

    setLoadingData(false);
  };

  const toggleSupervisor = (professorId: string) => {
    setSelectedSupervisors((prev) =>
      prev.includes(professorId)
        ? prev.filter((id) => id !== professorId)
        : [...prev, professorId]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);

    // Delete existing links
    await supabase
      .from('phd_supervisor_links')
      .delete()
      .eq('user_id', user.id);

    // Insert new links
    if (selectedSupervisors.length > 0) {
      await supabase
        .from('phd_supervisor_links')
        .insert(
          selectedSupervisors.map((professorId) => ({
            user_id: user.id,
            professor_id: professorId,
          }))
        );
    }

    setSaving(false);
    toast.success('Supervisors updated successfully!');
    navigate('/dashboard');
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero text-primary-foreground shadow-elevated">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold">Your Profile</h1>
                <p className="text-sm opacity-80">Set your PhD supervisors</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-card animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-accent" />
              <CardTitle className="font-serif">Select Your Supervisors</CardTitle>
            </div>
            <CardDescription>
              Choose the professors who supervise your PhD. Their courses will be marked as priority ⭐ for supervision, and you'll receive reminders if you haven't set your availability.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {professors.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No professors available yet.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ask the secretary to add professors first.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {professors.map((professor, index) => {
                  const isSelected = selectedSupervisors.includes(professor.id);
                  
                  return (
                    <div
                      key={professor.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer animate-fade-in ${
                        isSelected 
                          ? 'border-accent bg-accent/5 shadow-soft' 
                          : 'border-border hover:border-accent/50 hover:bg-muted/50'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => toggleSupervisor(professor.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSupervisor(professor.id)}
                        className="pointer-events-none"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {professor.full_name}
                        </p>
                        {professor.department && (
                          <p className="text-sm text-muted-foreground">
                            {professor.department}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Badge className="bg-accent text-accent-foreground">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Selected
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex gap-3 mt-6 pt-6 border-t border-border">
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
