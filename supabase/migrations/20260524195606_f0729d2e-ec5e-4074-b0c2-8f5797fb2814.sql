-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'patient');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    country TEXT DEFAULT 'Egypt',
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create doctor_details table
CREATE TABLE public.doctor_details (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialty TEXT,
    license_number TEXT,
    clinic_name TEXT,
    clinic_address TEXT,
    bio TEXT,
    consultation_fee DECIMAL(10,2) DEFAULT 1,
    rating DECIMAL(2,1) DEFAULT 1,
    years_experience INTEGER DEFAULT 1,
    is_verified BOOLEAN DEFAULT false,
    verification_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patient_details table
CREATE TABLE public.patient_details (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date_of_birth DATE,
    blood_type TEXT,
    allergies TEXT[],
    emergency_contact TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctor_details_updated_at
    BEFORE UPDATE ON public.doctor_details
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_details_updated_at
    BEFORE UPDATE ON public.patient_details
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_details ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- user_roles policies
CREATE POLICY "user_roles viewable by authenticated"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert their own role"
    ON public.user_roles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- doctor_details policies
CREATE POLICY "doctor_details viewable by everyone"
    ON public.doctor_details FOR SELECT
    USING (true);

CREATE POLICY "Doctors can update their own details"
    ON public.doctor_details FOR UPDATE
    USING (auth.uid() IN (
        SELECT user_id FROM public.profiles WHERE id = doctor_details.profile_id
    ));

CREATE POLICY "Doctors can insert their own details"
    ON public.doctor_details FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT user_id FROM public.profiles WHERE id = doctor_details.profile_id
    ));

-- patient_details policies
CREATE POLICY "Users can view their own patient details"
    ON public.patient_details FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM public.profiles WHERE id = patient_details.profile_id
    ));

CREATE POLICY "Users can insert their own patient details"
    ON public.patient_details FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT user_id FROM public.profiles WHERE id = patient_details.profile_id
    ));

CREATE POLICY "Users can update their own patient details"
    ON public.patient_details FOR UPDATE
    USING (auth.uid() IN (
        SELECT user_id FROM public.profiles WHERE id = patient_details.profile_id
    ));

-- Indexes for performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_doctor_details_profile_id ON public.doctor_details(profile_id);
CREATE INDEX idx_patient_details_profile_id ON public.patient_details(profile_id);
CREATE INDEX idx_doctor_details_specialty ON public.doctor_details(specialty);
CREATE INDEX idx_doctor_details_city ON public.doctor_details(clinic_address);
