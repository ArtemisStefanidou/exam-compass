import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  GraduationCap, 
  Calendar, 
  Users, 
  Star, 
  Trophy,
  CheckCircle2,
  ArrowRight,
  Shield
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Calendar,
      title: 'Exam Scheduling',
      description: 'Manage all exam dates, times, and locations in one place',
    },
    {
      icon: Users,
      title: 'Availability Tracking',
      description: 'PhD students mark their availability for each exam',
    },
    {
      icon: Star,
      title: 'Priority Marking',
      description: 'Supervisor courses are highlighted for quick action',
    },
    {
      icon: Trophy,
      title: 'Score System',
      description: 'Track and reward supervision participation',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="bg-gradient-hero text-primary-foreground">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-xl font-serif font-bold">ExamGuard</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild variant="secondary">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </nav>

        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-sm mb-6">
              <Shield className="w-4 h-4" />
              University Exam Management System
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight mb-6">
              Streamline Your{' '}
              <span className="text-gradient-gold">Exam Supervision</span>
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8 leading-relaxed">
              A modern platform for universities to manage exam supervisions, 
              track PhD student availability, and reward participation with 
              a transparent scoring system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="text-base">
                <Link to="/auth">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 text-base">
                <Link to="/auth">
                  Learn More
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete solution for managing exam supervisions at your university
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="shadow-card hover:shadow-elevated transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
              How It Works
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid gap-8">
              {[
                {
                  step: '1',
                  title: 'Secretary schedules exams',
                  description: 'Add courses, professors, and schedule exam dates with required supervisors',
                },
                {
                  step: '2',
                  title: 'PhD students set supervisors',
                  description: 'Students mark which professors supervise their PhD — these courses become priority',
                },
                {
                  step: '3',
                  title: 'Mark availability',
                  description: 'Students indicate which exams they can supervise, with priority exams highlighted',
                },
                {
                  step: '4',
                  title: 'Earn points',
                  description: 'Complete supervisions to earn points and climb the leaderboard',
                },
              ].map((item, index) => (
                <div 
                  key={item.step} 
                  className="flex gap-6 items-start animate-slide-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center flex-shrink-0 shadow-gold">
                    <span className="text-lg font-bold text-accent-foreground">{item.step}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-hero text-primary-foreground shadow-elevated overflow-hidden">
            <CardContent className="p-12 text-center relative">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent rounded-full blur-3xl" />
              </div>
              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                  Join your university's exam supervision system and start managing your availability today.
                </p>
                <Button asChild size="lg" variant="secondary">
                  <Link to="/auth">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Create Your Account
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                © 2024 ExamGuard. University Exam Supervision System.
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
