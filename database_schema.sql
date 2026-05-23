-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS ptj;

-- Users table
CREATE TABLE IF NOT EXISTS ptj.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT,
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'user',
    classification VARCHAR(100),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    registration_data TEXT,
    service_radius_km INT DEFAULT 10,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    notification_preferences JSONB DEFAULT '{"applications": true, "jobs": false, "recs": false}',
    google_id VARCHAR(255),
    avatar_url TEXT,
    banner_url TEXT,
    location TEXT,
    bio TEXT,
    skills JSONB,
    services JSONB,
    portfolios JSONB,
    criminal_record_url TEXT,
    theme_preference VARCHAR(10) DEFAULT 'light',
    language_preference VARCHAR(10) DEFAULT 'en',
    deletion_requested_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    account_status VARCHAR(20) DEFAULT 'active',
    suspended_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Applicant Profiles table
CREATE TABLE IF NOT EXISTS ptj.applicant_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES ptj.users(user_id) ON DELETE CASCADE,
    resume_url TEXT,
    bio TEXT,
    skills JSONB DEFAULT '[]',
    experience_years INT DEFAULT 0,
    experiences JSONB DEFAULT '[]',
    educations JSONB DEFAULT '[]',
    portfolios JSONB DEFAULT '[]',
    languages JSONB DEFAULT '[]',
    services JSONB DEFAULT '[]',
    social_links JSONB DEFAULT '{}',
    dob DATE,
    gender VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE IF NOT EXISTS ptj.companies (
    company_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    contact_email VARCHAR(255),
    phone VARCHAR(50),
    tax_id VARCHAR(50),
    license_number VARCHAR(100),
    cr_document_url TEXT,
    tax_document_url TEXT,
    verification_status VARCHAR(50) DEFAULT 'PENDING',
    rejection_reason TEXT,
    website VARCHAR(255),
    employees VARCHAR(50),
    industry VARCHAR(100),
    classification VARCHAR(100),
    foundedday VARCHAR(50),
    foundedmonth VARCHAR(50),
    foundedyear VARCHAR(50),
    sociallinks JSONB,
    benefits JSONB,
    tech_stack JSONB,
    location_tags JSONB,
    logo_url TEXT,
    office_photo1_url TEXT,
    office_photo2_url TEXT,
    official_national_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS ptj.categories (
    category_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    name_en VARCHAR(150),
    description TEXT,
    description_en TEXT
);

-- Jobs table
CREATE TABLE IF NOT EXISTS ptj.jobs (
    job_id BIGSERIAL PRIMARY KEY,
    company_id BIGINT REFERENCES ptj.companies(company_id),
    user_id UUID REFERENCES ptj.users(user_id),
    category_id BIGINT REFERENCES ptj.categories(category_id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    salary NUMERIC(10, 2),
    salary_min NUMERIC(10, 2),
    salary_max NUMERIC(10, 2),
    address TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    job_type JSON,
    classification VARCHAR(50),
    field_of_work JSON,
    slots_available INT DEFAULT 1,
    price_type VARCHAR(50) DEFAULT 'fixed',
    is_negotiable BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,
    work_time JSON,
    images JSON,
    skills JSONB DEFAULT '[]'
);

-- Job Categories (Junction table for Many-to-Many)
CREATE TABLE IF NOT EXISTS ptj.job_categories (
    job_id BIGINT NOT NULL REFERENCES ptj.jobs(job_id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES ptj.categories(category_id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, category_id)
);

-- Applications table
CREATE TABLE IF NOT EXISTS ptj.applications (
    application_id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES ptj.jobs(job_id),
    user_id UUID NOT NULL REFERENCES ptj.users(user_id),
    portfolio_url TEXT,
    address TEXT,
    cover_letter TEXT,
    resume_url TEXT,
    status VARCHAR(50) DEFAULT 'applied',
    applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (job_id, user_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS ptj.notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES ptj.users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    isRead BOOLEAN DEFAULT FALSE,
    type VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ptj.ratings (
    rating_id BIGSERIAL PRIMARY KEY,
    rater_user_id UUID REFERENCES ptj.users(user_id),
    rater_company_id BIGINT REFERENCES ptj.companies(company_id),
    target_user_id UUID REFERENCES ptj.users(user_id),
    target_company_id BIGINT REFERENCES ptj.companies(company_id),
    rating_value SMALLINT NOT NULL,
    rater_type VARCHAR(20) DEFAULT 'USER',
    comment TEXT,
    created_at TIMESTamptz DEFAULT CURRENT_TIMESTAMP
);

-- Admins table
CREATE TABLE IF NOT EXISTS ptj.admins (
    admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'operation_manager',
    is_active BOOLEAN DEFAULT TRUE,
    avatar_url TEXT,
    last_login_at TIMESTAMPTZ,
    invited_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Admin Activity Logs table
CREATE TABLE IF NOT EXISTS ptj.admin_activity_logs (
    log_id SERIAL PRIMARY KEY,
    admin_id UUID REFERENCES ptj.admins(admin_id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100),
    target_id TEXT,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Enum types for images
DO $$ BEGIN
    CREATE TYPE ptj_image_entity AS ENUM ('user', 'company', 'job', 'group');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE ptj_image_type AS ENUM ('profile', 'logo', 'cover', 'gallery', 'portfolio');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Images table
CREATE TABLE IF NOT EXISTS ptj.images (
    image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type ptj_image_entity NOT NULL,
    entity_id TEXT NOT NULL,
    image_type ptj_image_type DEFAULT 'gallery',
    image_url TEXT NOT NULL,
    file_size INT,
    alt_text TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Testimonials table
CREATE TABLE IF NOT EXISTS ptj.testimonials (
    testimonial_id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES ptj.users(user_id),
    body TEXT NOT NULL,
    body_en TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Translations table
CREATE TABLE IF NOT EXISTS ptj.translations (
    translation_id SERIAL PRIMARY KEY,
    translation_key VARCHAR(255) UNIQUE,
    en TEXT NOT NULL,
    ar TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Push Subscriptions table
CREATE TABLE IF NOT EXISTS ptj.push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES ptj.users(user_id) ON DELETE CASCADE,
    platform VARCHAR(10) NOT NULL,
    device_token TEXT,
    web_subscription JSONB,
    device_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_push_user_platform ON ptj.push_subscriptions(user_id, platform);

-- Help Categories table
CREATE TABLE IF NOT EXISTS ptj.help_categories (
    help_category_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    icon VARCHAR(50)
);

-- Help Articles table
CREATE TABLE IF NOT EXISTS ptj.help_articles (
    article_id BIGSERIAL PRIMARY KEY,
    category_id BIGINT NOT NULL REFERENCES ptj.help_categories(help_category_id),
    title VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    content TEXT NOT NULL,
    content_en TEXT,
    is_helpful_yes INT DEFAULT 0,
    is_helpful_no INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Job Views table
CREATE TABLE IF NOT EXISTS ptj.job_views (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT NOT NULL REFERENCES ptj.jobs(job_id),
    user_id UUID REFERENCES ptj.users(user_id),
    session_id VARCHAR(255),
    viewed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Monitoring Reports table
DO $$ BEGIN
    CREATE TYPE ptj_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS ptj.monitoring_reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type VARCHAR(255),
    description TEXT,
    frequency INT DEFAULT 1,
    severity ptj_severity DEFAULT 'LOW',
    suggested_solution TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
