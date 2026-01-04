-- Create role enum
CREATE TYPE public.app_role AS ENUM ('secretary', 'phd_student');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  supervisor_id UUID REFERENCES public.profiles(id),
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create professors table
CREATE TABLE public.professors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT,
  professor_id UUID REFERENCES public.professors(id),
  semester TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create exams table
CREATE TABLE public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  supervisors_needed INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create availability table
CREATE TABLE public.availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, exam_id)
);

-- Create supervision_assignments table
CREATE TABLE public.supervision_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed BOOLEAN NOT NULL DEFAULT false,
  points_awarded INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id, exam_id)
);

-- Create phd_supervisor_links (which professor supervises which PhD student)
CREATE TABLE public.phd_supervisor_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professor_id UUID NOT NULL REFERENCES public.professors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, professor_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervision_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phd_supervisor_links ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Secretary can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

CREATE POLICY "Secretary can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

-- Professors policies (everyone can view, secretary can manage)
CREATE POLICY "Anyone can view professors" ON public.professors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Secretary can manage professors" ON public.professors
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

-- Courses policies
CREATE POLICY "Anyone can view courses" ON public.courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Secretary can manage courses" ON public.courses
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

-- Exams policies
CREATE POLICY "Anyone can view exams" ON public.exams
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Secretary can manage exams" ON public.exams
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

-- Availability policies
CREATE POLICY "Users can view all availability" ON public.availability
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own availability" ON public.availability
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Supervision assignments policies
CREATE POLICY "Anyone can view assignments" ON public.supervision_assignments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Secretary can manage assignments" ON public.supervision_assignments
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'secretary'));

-- PhD supervisor links policies
CREATE POLICY "Anyone can view supervisor links" ON public.phd_supervisor_links
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own supervisor links" ON public.phd_supervisor_links
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Trigger to update profiles.updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();