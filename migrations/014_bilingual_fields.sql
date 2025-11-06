-- Bilingual Fields Migration for Khmer-First Localization
-- Adds name_en and name_km columns to support both English and Khmer content

-- Institutions table - Add bilingual name fields
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS name_km VARCHAR(255);
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS description_km TEXT;

-- Update existing data: copy current name to name_en (assuming current names are English)
UPDATE institutions
SET name_en = name, name_km = name
WHERE name_en IS NULL OR name_km IS NULL;

-- Courses table - Add bilingual fields
ALTER TABLE courses ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS name_km VARCHAR(255);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description_km TEXT;

-- Update existing data
UPDATE courses
SET name_en = name, name_km = name
WHERE name_en IS NULL OR name_km IS NULL;

-- Profiles table - Add bilingual full_name
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name_en VARCHAR(255);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name_km VARCHAR(255);

-- Update existing data
UPDATE profiles
SET full_name_en = full_name, full_name_km = full_name
WHERE (full_name_en IS NULL OR full_name_km IS NULL) AND full_name IS NOT NULL;

-- Academic Records table - Add semester translations
ALTER TABLE academic_records ADD COLUMN IF NOT EXISTS semester_en VARCHAR(50);
ALTER TABLE academic_records ADD COLUMN IF NOT EXISTS semester_km VARCHAR(50);

-- Update existing data
UPDATE academic_records
SET semester_en = semester, semester_km = semester
WHERE (semester_en IS NULL OR semester_km IS NULL) AND semester IS NOT NULL;

-- Add language preference to profiles for user's preferred language
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'km';

-- Create indexes for performance on bilingual queries
CREATE INDEX IF NOT EXISTS idx_institutions_name_en ON institutions(name_en);
CREATE INDEX IF NOT EXISTS idx_institutions_name_km ON institutions(name_km);
CREATE INDEX IF NOT EXISTS idx_courses_name_en ON courses(name_en);
CREATE INDEX IF NOT EXISTS idx_courses_name_km ON courses(name_km);
CREATE INDEX IF NOT EXISTS idx_profiles_language ON profiles(preferred_language);

-- Add check constraint for language preference
ALTER TABLE profiles
ADD CONSTRAINT check_language_preference
CHECK (preferred_language IN ('en', 'km'));

-- Create helper view for getting bilingual names based on language
CREATE OR REPLACE VIEW v_courses_bilingual AS
SELECT
    c.id,
    c.code,
    c.name,
    c.name_en,
    c.name_km,
    c.description,
    c.description_en,
    c.description_km,
    c.institution_id,
    c.created_at,
    c.updated_at
FROM courses c;

-- Create helper view for institutions
CREATE OR REPLACE VIEW v_institutions_bilingual AS
SELECT
    i.id,
    i.name,
    i.name_en,
    i.name_km,
    i.code,
    i.description,
    i.description_en,
    i.description_km,
    i.created_at,
    i.updated_at
FROM institutions i;

-- Create a function to get the appropriate name based on language
CREATE OR REPLACE FUNCTION get_localized_name(
    name_en VARCHAR,
    name_km VARCHAR,
    language VARCHAR DEFAULT 'km'
)
RETURNS VARCHAR AS $$
BEGIN
    IF language = 'en' AND name_en IS NOT NULL THEN
        RETURN name_en;
    ELSIF language = 'km' AND name_km IS NOT NULL THEN
        RETURN name_km;
    ELSIF name_en IS NOT NULL THEN
        RETURN name_en;
    ELSE
        RETURN name_km;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Document the migration
COMMENT ON COLUMN institutions.name_en IS 'English name of the institution';
COMMENT ON COLUMN institutions.name_km IS 'Khmer name of the institution';
COMMENT ON COLUMN courses.name_en IS 'English name of the course';
COMMENT ON COLUMN courses.name_km IS 'Khmer name of the course';
COMMENT ON COLUMN profiles.preferred_language IS 'User preferred language: en or km (default: km)';
COMMENT ON FUNCTION get_localized_name(VARCHAR, VARCHAR, VARCHAR) IS 'Returns the appropriate localized name based on language preference';
