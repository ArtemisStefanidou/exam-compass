import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  GraduationCap, 
  Plus,
  BookOpen,
  Calendar,
  Users,
  Loader2,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface Professor {
  id: string;
  full_name: string;
  department: string | null;
  email: string | null;
}

interface Course {
  id: string;
  name: string;
  code: string | null;
  semester: string | null;
  professor_id: string | null;
  professor?: Professor | null;
}

interface Exam {
  id: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  supervisors_needed: number;
  course_id: string;
  course?: Course | null;
}

export default function Manage() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form states
  const [newProfName, setNewProfName] = useState('');
  const [newProfDept, setNewProfDept] = useState('');
  const [newProfEmail, setNewProfEmail] = useState('');
  
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseProfessor, setNewCourseProfessor] = useState('');
  const [newCourseSemester, setNewCourseSemester] = useState('');
  
  const [newExamCourse, setNewExamCourse] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [newExamStart, setNewExamStart] = useState('09:00');
  const [newExamEnd, setNewExamEnd] = useState('12:00');
  const [newExamLocation, setNewExamLocation] = useState('');
  const [newExamSupervisors, setNewExamSupervisors] = useState('2');

  const [dialogOpen, setDialogOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    if (!loading && role !== 'secretary') {
      navigate('/dashboard');
    }
  }, [user, role, loading, navigate]);

  useEffect(() => {
    if (user && role === 'secretary') {
      fetchData();
    }
  }, [user, role]);

  const fetchData = async () => {
    setLoadingData(true);

    const [profsRes, coursesRes, examsRes] = await Promise.all([
      supabase.from('professors').select('*').order('full_name'),
      supabase.from('courses').select('*, professor:professors(*)').order('name'),
      supabase.from('exams').select('*, course:courses(*, professor:professors(*))').order('exam_date'),
    ]);

    if (profsRes.data) setProfessors(profsRes.data);
    if (coursesRes.data) setCourses(coursesRes.data as unknown as Course[]);
    if (examsRes.data) setExams(examsRes.data as unknown as Exam[]);

    setLoadingData(false);
  };

  const addProfessor = async () => {
    if (!newProfName.trim()) {
      toast.error('Please enter a professor name');
      return;
    }

    const { error } = await supabase.from('professors').insert({
      full_name: newProfName,
      department: newProfDept || null,
      email: newProfEmail || null,
    });

    if (error) {
      toast.error('Failed to add professor');
      return;
    }

    toast.success('Professor added!');
    setNewProfName('');
    setNewProfDept('');
    setNewProfEmail('');
    setDialogOpen(null);
    fetchData();
  };

  const addCourse = async () => {
    if (!newCourseName.trim()) {
      toast.error('Please enter a course name');
      return;
    }

    const { error } = await supabase.from('courses').insert({
      name: newCourseName,
      code: newCourseCode || null,
      professor_id: newCourseProfessor || null,
      semester: newCourseSemester || null,
    });

    if (error) {
      toast.error('Failed to add course');
      return;
    }

    toast.success('Course added!');
    setNewCourseName('');
    setNewCourseCode('');
    setNewCourseProfessor('');
    setNewCourseSemester('');
    setDialogOpen(null);
    fetchData();
  };

  const addExam = async () => {
    if (!newExamCourse || !newExamDate) {
      toast.error('Please select a course and date');
      return;
    }

    const { error } = await supabase.from('exams').insert({
      course_id: newExamCourse,
      exam_date: newExamDate,
      start_time: newExamStart,
      end_time: newExamEnd,
      location: newExamLocation || null,
      supervisors_needed: parseInt(newExamSupervisors) || 2,
    });

    if (error) {
      toast.error('Failed to add exam');
      return;
    }

    toast.success('Exam scheduled!');
    setNewExamCourse('');
    setNewExamDate('');
    setNewExamStart('09:00');
    setNewExamEnd('12:00');
    setNewExamLocation('');
    setNewExamSupervisors('2');
    setDialogOpen(null);
    fetchData();
  };

  const deleteExam = async (id: string) => {
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete exam');
      return;
    }
    toast.success('Exam deleted');
    fetchData();
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
                <h1 className="text-xl font-serif font-bold">Management</h1>
                <p className="text-sm opacity-80">Professors, Courses & Exams</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="professors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="professors">
              <Users className="w-4 h-4 mr-2" />
              Professors
            </TabsTrigger>
            <TabsTrigger value="courses">
              <BookOpen className="w-4 h-4 mr-2" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="exams">
              <Calendar className="w-4 h-4 mr-2" />
              Exams
            </TabsTrigger>
          </TabsList>

          {/* Professors Tab */}
          <TabsContent value="professors">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-serif">Professors</CardTitle>
                    <CardDescription>Manage faculty members</CardDescription>
                  </div>
                  <Dialog open={dialogOpen === 'professor'} onOpenChange={(o) => setDialogOpen(o ? 'professor' : null)}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Professor
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Professor</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>Full Name *</Label>
                          <Input 
                            value={newProfName} 
                            onChange={(e) => setNewProfName(e.target.value)} 
                            placeholder="Prof. John Smith"
                          />
                        </div>
                        <div>
                          <Label>Department</Label>
                          <Input 
                            value={newProfDept} 
                            onChange={(e) => setNewProfDept(e.target.value)} 
                            placeholder="Computer Science"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input 
                            type="email"
                            value={newProfEmail} 
                            onChange={(e) => setNewProfEmail(e.target.value)} 
                            placeholder="john.smith@university.edu"
                          />
                        </div>
                        <Button onClick={addProfessor} className="w-full">
                          Add Professor
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {professors.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No professors added yet</p>
                ) : (
                  <div className="space-y-2">
                    {professors.map((prof) => (
                      <div key={prof.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">{prof.full_name}</p>
                          {prof.department && (
                            <p className="text-sm text-muted-foreground">{prof.department}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-serif">Courses</CardTitle>
                    <CardDescription>Manage courses and assign professors</CardDescription>
                  </div>
                  <Dialog open={dialogOpen === 'course'} onOpenChange={(o) => setDialogOpen(o ? 'course' : null)}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Course
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Course</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>Course Name *</Label>
                          <Input 
                            value={newCourseName} 
                            onChange={(e) => setNewCourseName(e.target.value)} 
                            placeholder="Introduction to Programming"
                          />
                        </div>
                        <div>
                          <Label>Course Code</Label>
                          <Input 
                            value={newCourseCode} 
                            onChange={(e) => setNewCourseCode(e.target.value)} 
                            placeholder="CS101"
                          />
                        </div>
                        <div>
                          <Label>Professor</Label>
                          <Select value={newCourseProfessor} onValueChange={setNewCourseProfessor}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select professor" />
                            </SelectTrigger>
                            <SelectContent>
                              {professors.map((prof) => (
                                <SelectItem key={prof.id} value={prof.id}>
                                  {prof.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Semester</Label>
                          <Input 
                            value={newCourseSemester} 
                            onChange={(e) => setNewCourseSemester(e.target.value)} 
                            placeholder="Fall 2024"
                          />
                        </div>
                        <Button onClick={addCourse} className="w-full">
                          Add Course
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {courses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No courses added yet</p>
                ) : (
                  <div className="space-y-2">
                    {courses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">
                            {course.name}
                            {course.code && <span className="text-muted-foreground ml-2">({course.code})</span>}
                          </p>
                          {course.professor && (
                            <p className="text-sm text-muted-foreground">Prof. {course.professor.full_name}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exams Tab */}
          <TabsContent value="exams">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-serif">Exams</CardTitle>
                    <CardDescription>Schedule and manage exam supervisions</CardDescription>
                  </div>
                  <Dialog open={dialogOpen === 'exam'} onOpenChange={(o) => setDialogOpen(o ? 'exam' : null)}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Schedule Exam
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Schedule New Exam</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label>Course *</Label>
                          <Select value={newExamCourse} onValueChange={setNewExamCourse}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select course" />
                            </SelectTrigger>
                            <SelectContent>
                              {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                  {course.name} {course.code && `(${course.code})`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Date *</Label>
                          <Input 
                            type="date"
                            value={newExamDate} 
                            onChange={(e) => setNewExamDate(e.target.value)} 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Start Time</Label>
                            <Input 
                              type="time"
                              value={newExamStart} 
                              onChange={(e) => setNewExamStart(e.target.value)} 
                            />
                          </div>
                          <div>
                            <Label>End Time</Label>
                            <Input 
                              type="time"
                              value={newExamEnd} 
                              onChange={(e) => setNewExamEnd(e.target.value)} 
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Location</Label>
                          <Input 
                            value={newExamLocation} 
                            onChange={(e) => setNewExamLocation(e.target.value)} 
                            placeholder="Room A101"
                          />
                        </div>
                        <div>
                          <Label>Supervisors Needed</Label>
                          <Input 
                            type="number"
                            min="1"
                            value={newExamSupervisors} 
                            onChange={(e) => setNewExamSupervisors(e.target.value)} 
                          />
                        </div>
                        <Button onClick={addExam} className="w-full">
                          Schedule Exam
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {exams.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No exams scheduled yet</p>
                ) : (
                  <div className="space-y-2">
                    {exams.map((exam) => (
                      <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-medium">
                            {exam.course?.name || 'Unknown Course'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(exam.exam_date).toLocaleDateString()} • {exam.start_time.slice(0, 5)} - {exam.end_time.slice(0, 5)}
                            {exam.location && ` • ${exam.location}`}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteExam(exam.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
