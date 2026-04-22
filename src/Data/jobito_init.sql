CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP SCHEMA IF EXISTS ptj CASCADE;
CREATE SCHEMA IF NOT EXISTS ptj;
SET search_path = ptj, public;

CREATE TABLE users (
user_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
full_name     VARCHAR(255) NOT NULL,
email         VARCHAR(255) NOT NULL UNIQUE,
password_hash TEXT NOT NULL,
phone         VARCHAR(50),
role          VARCHAR(50) DEFAULT 'student',
classification VARCHAR(100),
latitude      NUMERIC(10,7),
longitude     NUMERIC(10,7),
location_geo  geography(Point,4326),
location      TEXT,
service_radius_km INT DEFAULT 10,
google_id     VARCHAR(255),
avatar_url    TEXT,
banner_url    TEXT,
registration_data TEXT,
is_phone_verified BOOLEAN DEFAULT FALSE,
notification_preferences JSONB DEFAULT '{"applications": true, "jobs": false, "recs": false}',
theme_preference VARCHAR(10) DEFAULT 'light',
language_preference VARCHAR(10) DEFAULT 'en',
is_active     BOOLEAN DEFAULT TRUE,
deletion_requested_at TIMESTAMPTZ,
created_at    TIMESTAMPTZ DEFAULT now(),
updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ptj.applicant_profiles (
  profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  resume_url TEXT,
  bio TEXT,
  skills JSONB DEFAULT '[]',
  services JSONB DEFAULT '[]',
  experience_years INT DEFAULT 0,
  experiences JSONB DEFAULT '[]',
  educations JSONB DEFAULT '[]',
  portfolios JSONB DEFAULT '[]',
  languages JSONB DEFAULT '[]',
  social_links JSONB DEFAULT '{}',
  dob DATE,
  gender VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_applicant_profiles_skills_gin ON ptj.applicant_profiles USING GIN (skills);
CREATE INDEX idx_users_location_gist ON users USING GIST(location_geo);

CREATE OR REPLACE FUNCTION ptj.users_location_trigger()
RETURNS trigger AS $$
BEGIN
IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
  NEW.location_geo := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_location
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION ptj.users_location_trigger();

CREATE TABLE companies (
company_id      BIGSERIAL PRIMARY KEY,
name            VARCHAR(255) NOT NULL,
name_en         VARCHAR(255),
description     TEXT,
description_en  TEXT,
address         TEXT,
contact_email   VARCHAR(255),
phone           VARCHAR(50),
tax_id          VARCHAR(50),
license_number  VARCHAR(100),
cr_document_url TEXT,
verification_status VARCHAR(50) DEFAULT 'PENDING',
rejection_reason TEXT,
website         VARCHAR(255),
employees       VARCHAR(50),
industry        VARCHAR(100),
foundedday      VARCHAR(50),
foundedmonth    VARCHAR(50),
foundedyear     VARCHAR(50),
sociallinks     JSONB,
benefits        JSONB,
tech_stack      JSONB,
location_tags   JSONB,
logo_url        TEXT,
office_photo1_url TEXT,
office_photo2_url TEXT,
classification VARCHAR(100),
official_national_id VARCHAR(50),
created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE categories (
category_id  BIGSERIAL PRIMARY KEY,
name         VARCHAR(150) UNIQUE NOT NULL,
name_en      VARCHAR(150),
description  TEXT,
description_en TEXT
);

CREATE TYPE ptj_job_type AS ENUM ('part-time','one-time','event','freelance','internship');

CREATE TABLE jobs (
job_id        BIGSERIAL PRIMARY KEY,
company_id    BIGINT REFERENCES companies(company_id) ON DELETE CASCADE,
user_id       UUID REFERENCES users(user_id) ON DELETE CASCADE,
category_id   BIGINT REFERENCES categories(category_id) ON DELETE SET NULL,
title         VARCHAR(255) NOT NULL,
title_en      VARCHAR(255),
description   TEXT,
description_en TEXT,
salary        NUMERIC(10,2),
salary_min    NUMERIC(10,2),
salary_max    NUMERIC(10,2),
address       TEXT,
latitude      NUMERIC(10,7),
longitude     NUMERIC(10,7),
location_geo  geography(Point,4326),
job_type      VARCHAR(50) DEFAULT 'part-time',
classification VARCHAR(50),
slots_available INT DEFAULT 1,
price_type    VARCHAR(50) DEFAULT 'fixed',
is_negotiable BOOLEAN DEFAULT FALSE,
is_active     BOOLEAN DEFAULT TRUE,
work_time     JSONB,
images        JSONB,
skills        JSONB DEFAULT '[]',
expires_at    TIMESTAMPTZ,
created_at    TIMESTAMPTZ DEFAULT now(),
updated_at    TIMESTAMPTZ DEFAULT now(),
CONSTRAINT chk_job_owner CHECK (
  (company_id IS NOT NULL AND user_id IS NULL) OR
  (company_id IS NULL AND user_id IS NOT NULL)
)
);

CREATE FUNCTION ptj.jobs_location_trigger() RETURNS trigger AS $$
BEGIN
IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
  NEW.location_geo := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
END IF;
NEW.updated_at := now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_jobs_location
BEFORE INSERT OR UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION ptj.jobs_location_trigger();


CREATE INDEX idx_jobs_location_gist ON jobs USING GIST(location_geo);

CREATE INDEX idx_jobs_title_trgm ON jobs USING GIN (title gin_trgm_ops);


CREATE TABLE applications (
application_id BIGSERIAL PRIMARY KEY,
job_id         BIGINT REFERENCES jobs(job_id) ON DELETE CASCADE,
user_id        UUID REFERENCES users(user_id) ON DELETE CASCADE,
portfolio_url  TEXT,
cover_letter   TEXT,
resume_url     TEXT,
status         VARCHAR(50) DEFAULT 'applied' CHECK (status IN ('applied', 'reviewing', 'hired', 'declined')),
applied_at     TIMESTAMPTZ DEFAULT now(),
UNIQUE (job_id, user_id)
);

CREATE TABLE ratings (
rating_id    BIGSERIAL PRIMARY KEY,
user_id      UUID REFERENCES users(user_id) ON DELETE CASCADE,
company_id   BIGINT REFERENCES companies(company_id) ON DELETE CASCADE,
rating_value SMALLINT CHECK (rating_value BETWEEN 1 AND 5),
comment      TEXT,
created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE work_groups (
group_id     BIGSERIAL PRIMARY KEY,
name         VARCHAR(255) NOT NULL,
description  TEXT,
created_by   UUID REFERENCES users(user_id),
created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE group_members (
member_id    BIGSERIAL PRIMARY KEY,
group_id     BIGINT REFERENCES work_groups(group_id) ON DELETE CASCADE,
user_id      UUID REFERENCES users(user_id) ON DELETE CASCADE,
joined_at    TIMESTAMPTZ DEFAULT now(),
UNIQUE (group_id, user_id)
);

CREATE TABLE notifications (
notification_id BIGSERIAL PRIMARY KEY,
user_id      UUID REFERENCES users(user_id) ON DELETE CASCADE,
message      TEXT,
is_read      BOOLEAN DEFAULT FALSE,
payload      JSONB,
created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE files (
file_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id   UUID REFERENCES users(user_id) ON DELETE CASCADE,
file_url  TEXT NOT NULL,
file_type VARCHAR(50),
file_size INT,
created_at TIMESTAMPTZ DEFAULT now(),
CHECK (LEFT(file_url, 8) = 'https://')
);

CREATE TABLE availability (
  availability_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  day_of_week VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL
);

CREATE TABLE otp_codes (
  otp_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0
);

CREATE TABLE reports (
  report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES users(user_id),
  reported_user_id UUID REFERENCES users(user_id),
  reported_job_id BIGINT REFERENCES jobs(job_id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  status VARCHAR(50) DEFAULT 'PENDING'
);


CREATE TABLE ptj.favorites (
  favorite_id BIGSERIAL PRIMARY KEY,
  user_id      UUID REFERENCES users(user_id) ON DELETE CASCADE,
  job_id       BIGINT REFERENCES jobs(job_id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, job_id)
);


CREATE TYPE ptj_image_entity AS ENUM (
'user',
'company',
'job',
'group'
);

CREATE TYPE ptj_image_type AS ENUM (
'profile',     
'logo',       
'cover',        
'gallery',      
'portfolio'    
);

CREATE TYPE ptj_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE images (
image_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

entity_type ptj_image_entity NOT NULL,
entity_id TEXT NOT NULL, 

image_type ptj_image_type DEFAULT 'gallery',

image_url TEXT NOT NULL,
file_size INT,
alt_text TEXT,

is_primary BOOLEAN DEFAULT FALSE,

created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_images_entity 
ON images(entity_type, entity_id);

CREATE INDEX idx_images_primary 
ON images(is_primary);

CREATE UNIQUE INDEX unique_primary_image
ON images(entity_type, entity_id)
WHERE is_primary = TRUE;

-- Messaging Tables
CREATE TABLE ptj.conversations (
  conversation_id BIGSERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ptj.conversation_participants (
  conversation_id BIGINT REFERENCES ptj.conversations(conversation_id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(user_id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE ptj.messages (
  message_id      BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT REFERENCES ptj.conversations(conversation_id) ON DELETE CASCADE,
  sender_id       UUID REFERENCES users(user_id) ON DELETE SET NULL,
  text            TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE testimonials (
testimonial_id BIGSERIAL PRIMARY KEY,
user_id        UUID REFERENCES users(user_id) ON DELETE CASCADE,
body           TEXT NOT NULL,
body_en        TEXT,
is_featured    BOOLEAN DEFAULT FALSE,
created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON testimonials(is_featured);

-- RBAC Tables
CREATE TABLE ptj.roles (
  role_id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL, -- 'admin', 'manager', 'student', 'company'
  description TEXT
);

CREATE TABLE ptj.permissions (
  permission_id BIGSERIAL PRIMARY KEY,
  action VARCHAR(50) NOT NULL, -- 'CREATE', 'READ', 'UPDATE', 'DELETE'
  entity VARCHAR(50) NOT NULL, -- 'JOB', 'USER', 'COMPANY'
  UNIQUE(action, entity)
);

CREATE TABLE ptj.role_permissions (
  role_id BIGINT REFERENCES ptj.roles(role_id) ON DELETE CASCADE,
  permission_id BIGINT REFERENCES ptj.permissions(permission_id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Audit Logs for AI Monitoring (Stores all data entering/leaving the system via TRAFFIC entity)
CREATE TABLE ptj.audit_logs (
  log_id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,    -- HTTP Method (GET, POST, etc.) or Internal Action
  entity VARCHAR(50) NOT NULL,    -- 'TRAFFIC' for global monitoring or entity name
  entity_id TEXT,                 -- URL or specific entity ID
  metadata JSONB,                 -- {reqBody, resBody, duration, statusCode}
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Smart Monitoring Reports (Rule-based Analysis)
CREATE TABLE ptj.monitoring_reports (
  report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_type VARCHAR(255) NOT NULL,
  description TEXT,
  frequency INT DEFAULT 1,
  severity ptj_severity DEFAULT 'LOW',
  suggested_solution TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Why Choose Us (Features)
CREATE TABLE ptj.features (
  feature_id     BIGSERIAL PRIMARY KEY,
  title          VARCHAR(255) NOT NULL,
  title_en       VARCHAR(255),
  description    TEXT NOT NULL,
  description_en TEXT,
  icon           VARCHAR(50),
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- About Stats
CREATE TABLE ptj.about_stats (
  stat_id    BIGSERIAL PRIMARY KEY,
  label      VARCHAR(100) NOT NULL,
  label_en   VARCHAR(100),
  value      VARCHAR(50) NOT NULL,
  icon       VARCHAR(50)
);

-- Services Table
CREATE TABLE ptj.services (
  service_id BIGSERIAL PRIMARY KEY,
  title      VARCHAR(255) NOT NULL,
  title_en   VARCHAR(255),
  description TEXT NOT NULL,
  description_en TEXT,
  icon       VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Help Center Tables
CREATE TABLE ptj.help_categories (
  help_category_id BIGSERIAL PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  name_en         VARCHAR(100),
  icon            VARCHAR(50)
);

CREATE TABLE ptj.help_articles (
  article_id      BIGSERIAL PRIMARY KEY,
  category_id     BIGINT REFERENCES ptj.help_categories(help_category_id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  title_en        VARCHAR(255),
  content         TEXT NOT NULL,
  content_en      TEXT,
  is_helpful_yes  INT DEFAULT 0
);

-- Translations table for UI and general content
CREATE TABLE ptj.translations (
  translation_id BIGSERIAL PRIMARY KEY,
  translation_key VARCHAR(255) UNIQUE NOT NULL,
  en TEXT NOT NULL,
  ar TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO ptj.translations (translation_key, en, ar) VALUES
('nav.home', 'Home', 'الرئيسية'),
('nav.jobs', 'Find Jobs', 'بحث عن وظائف'),
('nav.companies', 'Browse Companies', 'تصفح الشركات'),
('nav.about', 'About the platform', 'عن المنصة'),
('nav.contact', 'Contact us', 'اتصل بنا'),
('nav.login', 'Login', 'تسجيل الدخول'),
('nav.signup', 'Sign Up', 'إنشاء حساب'),
('nav.dashboard', 'Control panel', 'لوحة التحكم'),
('nav.profile', 'Profile', 'الملف الشخصي'),
('nav.messages', 'Messages', 'الرسائل'),
('nav.joblist', 'Job Listing', 'قائمة الوظائف'),
('nav.logout', 'Logout', 'تسجيل الخروج'),
('common.search', 'Search', 'بحث'),
('common.save', 'Save', 'حفظ'),
('common.cancel', 'Cancel', 'إلغاء');

CREATE INDEX idx_translations_en ON ptj.translations (en);