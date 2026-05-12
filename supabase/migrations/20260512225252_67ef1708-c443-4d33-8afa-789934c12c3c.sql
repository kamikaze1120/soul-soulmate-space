-- Enums
CREATE TYPE public.gender AS ENUM ('male', 'female');
CREATE TYPE public.app_mode AS ENUM ('matrimonial', 'sisterhood', 'brotherhood');
CREATE TYPE public.marital_status AS ENUM ('single', 'divorced', 'separated', 'widowed');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  verified_gender public.gender,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  primary_mode public.app_mode,
  bio TEXT,
  marital_status public.marital_status,
  has_kids BOOLEAN NOT NULL DEFAULT false,
  kids_age_groups TEXT[],
  city TEXT,
  country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  blur_photos BOOLEAN NOT NULL DEFAULT true,
  wali_contact TEXT,
  liveness_video_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Mode entitlements
CREATE TABLE public.mode_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode public.app_mode NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_trial BOOLEAN NOT NULL DEFAULT false,
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, mode)
);

ALTER TABLE public.mode_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own entitlements" ON public.mode_entitlements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- User roles (separate table — never store roles on profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER entitlements_updated_at BEFORE UPDATE ON public.mode_entitlements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta_gender TEXT;
  meta_name TEXT;
BEGIN
  meta_gender := NEW.raw_user_meta_data->>'gender';
  meta_name := COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, display_name, verified_gender)
  VALUES (
    NEW.id,
    meta_name,
    CASE
      WHEN meta_gender = 'male' THEN 'male'::public.gender
      WHEN meta_gender = 'female' THEN 'female'::public.gender
      ELSE NULL
    END
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();