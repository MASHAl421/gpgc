-- Add semester column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_bs_student boolean DEFAULT NULL,
ADD COLUMN semester integer DEFAULT NULL;

-- Add semester column to subjects table to categorize subjects by semester
ALTER TABLE public.subjects 
ADD COLUMN semester integer DEFAULT NULL;

-- Update existing subjects to semester 1
UPDATE public.subjects SET semester = 1 WHERE name = 'Functional English';