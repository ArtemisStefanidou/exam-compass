import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  LogOut, 
  Calendar, 
  Users, 
  Star, 
  Trophy,
  BookOpen,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Exam {
  id: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  location: string;
  supervisors_needed: number;
  course: {
    id: string;
    name: string;
    code: string;
    professor: {
      id: string;
      full_name: string;
    } | null;
  };
}

interface Profile {
  id: string;
  full_name: string;
  score: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, role, loading, signOut } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [supervisorLinks, setSupervisorLinks] = useState<string[]>([]);
  const [loadingExams, setLoadingExams] = useState(true);

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
    setLoadingExams(true);
    
    // Fetch exams with course and professor info
    const { data: examsData } = await supabase
      .from('exams')
      .select(`
        id,
        exam_date,
        start_time,
        end_time,
        location,
        supervisors_needed,
        course:courses(
          id,
          name,
          code,
          professor:professors(id, full_name)
        )
      `)
      .order('exam_date', { ascending: true });

    if (examsData) {
      setExams(examsData as unknown as Exam[]);
    }

    // Fetch availability for current user
    if (user) {
      const { data: availData } = await supabase
        .from('availability')
        .select('exam_id, is_available')
        .eq('user_id', user.id);

      if (availData) {
        const availMap: Record<string, boolean> = {};
        availData.forEach((a) => {
          availMap[a.exam_id] = a.is_available;
        });
        setAvailability(availMap);
      }

      // Fetch supervisor links
      const { data: linksData } = await supabase
        .from('phd_supervisor_links')
        .select('professor_id')
        .eq('user_id', user.id);

      if (linksData) {
        setSupervisorLinks(linksData.map((l) => l.professor_id));
      }
    }

    // Fetch all profiles for leaderboard
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, score')
      .order('score', { ascending: false })
      .limit(10);

    if (profilesData) {
      setProfiles(profilesData);
    }

    setLoadingExams(false);
  };

  const toggleAvailability = async (examId: string) => {
    if (!user) return;

    const currentAvail = availability[examId];
    
    if (currentAvail === undefined) {
      // Insert new availability
      await supabase
        .from('availability')
        .insert({ user_id: user.id, exam_id: examId, is_available: true });
      setAvailability({ ...availability, [examId]: true });
    } else {
      // Update existing
      await supabase
        .from('availability')
        .update({ is_available: !currentAvail })
        .eq('user_id', user.id)
        .eq('exam_id', examId);
      setAvailability({ ...availability, [examId]: !currentAvail });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isPriorityExam = (exam: Exam) => {
    if (!exam.course?.professor) return false;
    return supervisorLinks.includes(exam.course.professor.id);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero text-primary-foreground shadow-elevated sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold">ExamGuard</h1>
                <p className="text-sm opacity-80">
                  {role === 'secretary' ? 'Secretary Dashboard' : 'PhD Student Dashboard'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                {role === 'secretary' ? 'Secretary' : 'PhD Student'}
              </Badge>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exams List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-serif font-bold text-foreground">Upcoming Exams</h2>
                <p className="text-muted-foreground">
                  {role === 'phd_student' 
                    ? 'Mark your availability for supervision' 
                    : 'Manage exam supervision assignments'}
                </p>
              </div>
              <Badge variant="outline" className="text-muted-foreground">
                <Calendar className="w-3 h-3 mr-1" />
                {exams.length} exams
              </Badge>
            </div>

            {loadingExams ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : exams.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="py-12 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold text-foreground mb-2">No exams scheduled</h3>
                  <p className="text-muted-foreground text-sm">
                    {role === 'secretary' 
                      ? 'Add courses and schedule exams to get started' 
                      : 'Check back later for upcoming exams'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {exams.map((exam, index) => {
                  const isPriority = isPriorityExam(exam);
                  const isAvailable = availability[exam.id];
                  
                  return (
                    <Card 
                      key={exam.id} 
                      className={`shadow-soft transition-all hover:shadow-card animate-fade-in ${
                        isPriority ? 'ring-2 ring-accent/50 bg-accent/5' : ''
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {isPriority && (
                                <Star className="w-5 h-5 priority-star fill-accent animate-pulse-gold" />
                              )}
                              <h3 className="font-semibold text-foreground">
                                {exam.course?.name || 'Unknown Course'}
                              </h3>
                              {exam.course?.code && (
                                <Badge variant="secondary" className="text-xs">
                                  {exam.course.code}
                                </Badge>
                              )}
                            </div>
                            
                            {exam.course?.professor && (
                              <p className="text-sm text-muted-foreground mb-3">
                                Prof. {exam.course.professor.full_name}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {formatDate(exam.exam_date)}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {formatTime(exam.start_time)} - {formatTime(exam.end_time)}
                              </span>
                              {exam.location && (
                                <span className="flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4" />
                                  {exam.location}
                                </span>
                              )}
                              <span className="flex items-center gap-1.5">
                                <Users className="w-4 h-4" />
                                {exam.supervisors_needed} needed
                              </span>
                            </div>
                          </div>
                          
                          {role === 'phd_student' && (
                            <Button
                              variant={isAvailable ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleAvailability(exam.id)}
                              className={isAvailable ? 'bg-success hover:bg-success/90' : ''}
                            >
                              {isAvailable ? (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                  Available
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-4 h-4 mr-1.5" />
                                  Mark Available
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leaderboard */}
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-accent" />
                  <CardTitle className="text-lg font-serif">Top Supervisors</CardTitle>
                </div>
                <CardDescription>
                  PhD students ranked by supervision points
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No rankings yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {profiles.slice(0, 5).map((profile, index) => (
                      <div 
                        key={profile.id} 
                        className="flex items-center gap-3 animate-slide-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-accent text-accent-foreground' :
                          index === 1 ? 'bg-muted text-muted-foreground' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-secondary text-secondary-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate text-sm">
                            {profile.full_name || 'Anonymous'}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {profile.score} pts
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats for Secretary */}
            {role === 'secretary' && (
              <Card className="shadow-soft bg-gradient-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-serif">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/manage')}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Manage Courses
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/manage')}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Exams
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/manage')}>
                    <Users className="w-4 h-4 mr-2" />
                    Assign Supervisors
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Set Supervisor for PhD students */}
            {role === 'phd_student' && (
              <Card className="shadow-soft bg-gradient-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-serif flex items-center gap-2">
                    <Star className="w-5 h-5 text-accent" />
                    Your Supervisor
                  </CardTitle>
                  <CardDescription>
                    Exams from your supervisor's courses are marked as priority
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/profile')}>
                    Set Supervisor
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
