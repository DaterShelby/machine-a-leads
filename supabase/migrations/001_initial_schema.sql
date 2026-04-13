-- Multi-Vertical Lead Generation Platform
-- Initial Schema Migration
-- Created: 2026-04-13

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search optimization

-- ============================================================================
-- CUSTOM TYPES (ENUMS)
-- ============================================================================

CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');
CREATE TYPE public.lead_status AS ENUM ('new', 'image_generated', 'contacted', 'opened', 'clicked', 'responded', 'converted', 'unsubscribed');
CREATE TYPE public.job_type AS ENUM ('data_collection', 'satellite_fetch', 'ai_generation', 'email_send', 'follow_up');
CREATE TYPE public.job_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE public.user_role AS ENUM ('admin', 'professional', 'viewer');

-- ============================================================================
-- PROFILES TABLE (extends auth.users)
-- ============================================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  sector TEXT,
  role public.user_role DEFAULT 'professional' NOT NULL,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('active', 'inactive', 'trial')),
  max_leads_per_month INTEGER DEFAULT 50,
  leads_used_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_subscription_status ON public.profiles(subscription_status);

-- ============================================================================
-- VERTICALS TABLE
-- ============================================================================

CREATE TABLE public.verticals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_emoji TEXT,
  ai_prompt TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.verticals ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_verticals_is_active ON public.verticals(is_active);

-- ============================================================================
-- PROPERTIES TABLE
-- ============================================================================

CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vertical_id UUID NOT NULL REFERENCES public.verticals(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  postal_code TEXT,
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  price DECIMAL(12, 2),
  property_type TEXT,
  surface_area DECIMAL(10, 2),
  description TEXT,
  image_url TEXT,
  ai_generated_image_url TEXT,
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  raw_data JSONB DEFAULT '{}',
  is_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_properties_vertical_id ON public.properties(vertical_id);
CREATE INDEX idx_properties_postal_code ON public.properties(postal_code);
CREATE INDEX idx_properties_city ON public.properties(city);
CREATE INDEX idx_properties_price ON public.properties(price);
CREATE INDEX idx_properties_coordinates ON public.properties USING GIST (
  ll_to_earth(latitude, longitude)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_properties_is_processed ON public.properties(is_processed);
CREATE INDEX idx_properties_created_at ON public.properties(created_at DESC);

-- ============================================================================
-- EMAIL TEMPLATES TABLE
-- ============================================================================

CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vertical_id UUID NOT NULL REFERENCES public.verticals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  body_html TEXT NOT NULL,
  from_name TEXT,
  from_email TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vertical_id, name)
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_email_templates_vertical_id ON public.email_templates(vertical_id);
CREATE INDEX idx_email_templates_is_active ON public.email_templates(is_active);

-- ============================================================================
-- CAMPAIGNS TABLE
-- ============================================================================

CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vertical_id UUID NOT NULL REFERENCES public.verticals(id) ON DELETE RESTRICT,
  email_template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status public.campaign_status DEFAULT 'draft',
  target_postal_codes TEXT[] DEFAULT '{}',
  target_cities TEXT[] DEFAULT '{}',
  target_price_min DECIMAL(12, 2),
  target_price_max DECIMAL(12, 2),
  total_leads_targeted INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  leads_contacted INTEGER DEFAULT 0,
  leads_converted INTEGER DEFAULT 0,
  budget_allocated DECIMAL(12, 2),
  budget_spent DECIMAL(12, 2) DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_campaigns_professional_id ON public.campaigns(professional_id);
CREATE INDEX idx_campaigns_vertical_id ON public.campaigns(vertical_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE INDEX idx_campaigns_created_at ON public.campaigns(created_at DESC);

-- ============================================================================
-- LEADS TABLE
-- ============================================================================

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  status public.lead_status DEFAULT 'new',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  property_address TEXT,
  property_postal_code TEXT,
  property_city TEXT,
  property_price DECIMAL(12, 2),
  property_description TEXT,
  ai_generated_image_url TEXT,
  personalized_message TEXT,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  engagement_score INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_leads_campaign_id ON public.leads(campaign_id);
CREATE INDEX idx_leads_property_id ON public.leads(property_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_contact_email ON public.leads(contact_email);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_campaign_status ON public.leads(campaign_id, status);

-- ============================================================================
-- PIPELINE JOBS TABLE
-- ============================================================================

CREATE TABLE public.pipeline_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  job_type public.job_type NOT NULL,
  status public.job_status DEFAULT 'pending',
  priority INTEGER DEFAULT 5,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  total_items INTEGER DEFAULT 0,
  processed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  error_message TEXT,
  job_params JSONB DEFAULT '{}',
  result_data JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.pipeline_jobs ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_pipeline_jobs_campaign_id ON public.pipeline_jobs(campaign_id);
CREATE INDEX idx_pipeline_jobs_status ON public.pipeline_jobs(status);
CREATE INDEX idx_pipeline_jobs_job_type ON public.pipeline_jobs(job_type);
CREATE INDEX idx_pipeline_jobs_created_at ON public.pipeline_jobs(created_at DESC);
CREATE INDEX idx_pipeline_jobs_status_priority ON public.pipeline_jobs(status, priority DESC);

-- ============================================================================
-- FOLLOW-UP SEQUENCES TABLE
-- ============================================================================

CREATE TABLE public.follow_up_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  email_template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'failed', 'skipped')),
  message_body TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.follow_up_sequences ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_follow_up_sequences_campaign_id ON public.follow_up_sequences(campaign_id);
CREATE INDEX idx_follow_up_sequences_lead_id ON public.follow_up_sequences(lead_id);
CREATE INDEX idx_follow_up_sequences_scheduled_for ON public.follow_up_sequences(scheduled_for);
CREATE INDEX idx_follow_up_sequences_status ON public.follow_up_sequences(status);

-- ============================================================================
-- LEAD PURCHASES TABLE (SaaS model)
-- ============================================================================

CREATE TABLE public.lead_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  price_paid DECIMAL(12, 2) NOT NULL,
  is_exclusive BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(professional_id, lead_id)
);

ALTER TABLE public.lead_purchases ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_lead_purchases_professional_id ON public.lead_purchases(professional_id);
CREATE INDEX idx_lead_purchases_lead_id ON public.lead_purchases(lead_id);
CREATE INDEX idx_lead_purchases_purchased_at ON public.lead_purchases(purchased_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- PROFILES: Users can only view/edit their own profile; admins can see all
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- VERTICALS: Everyone can read active verticals; only admins can modify
CREATE POLICY "Verticals are readable" ON public.verticals
  FOR SELECT USING (is_active OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Only admins can modify verticals" ON public.verticals
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- PROPERTIES: Readable by authenticated users; modifiable only by admins
CREATE POLICY "Properties are readable to authenticated users" ON public.properties
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify properties" ON public.properties
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- EMAIL TEMPLATES: Readable by authenticated users; modifiable by admins or template creator
CREATE POLICY "Email templates are readable" ON public.email_templates
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active);

CREATE POLICY "Only admins can modify email templates" ON public.email_templates
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- CAMPAIGNS: Users can only see their own campaigns; admins can see all
CREATE POLICY "Users can view their own campaigns" ON public.campaigns
  FOR SELECT USING (
    professional_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can create campaigns" ON public.campaigns
  FOR INSERT WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Users can update their own campaigns" ON public.campaigns
  FOR UPDATE USING (professional_id = auth.uid());

CREATE POLICY "Users can delete their own campaigns" ON public.campaigns
  FOR DELETE USING (professional_id = auth.uid());

-- LEADS: Users can see leads from their campaigns; can browse anonymized leads; need purchase for details
CREATE POLICY "Users can view leads from their campaigns" ON public.leads
  FOR SELECT USING (
    campaign_id IN (SELECT id FROM public.campaigns WHERE professional_id = auth.uid())
    OR id IN (SELECT lead_id FROM public.lead_purchases WHERE professional_id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can only insert leads in their campaigns" ON public.leads
  FOR INSERT WITH CHECK (
    campaign_id IN (SELECT id FROM public.campaigns WHERE professional_id = auth.uid())
  );

CREATE POLICY "Users can update leads in their campaigns" ON public.leads
  FOR UPDATE USING (
    campaign_id IN (SELECT id FROM public.campaigns WHERE professional_id = auth.uid())
  );

-- PIPELINE JOBS: Users can see jobs for their campaigns; admins see all
CREATE POLICY "Users can view pipeline jobs for their campaigns" ON public.pipeline_jobs
  FOR SELECT USING (
    campaign_id IN (SELECT id FROM public.campaigns WHERE professional_id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can create pipeline jobs in their campaigns" ON public.pipeline_jobs
  FOR INSERT WITH CHECK (
    campaign_id IN (SELECT id FROM public.campaigns WHERE professional_id = auth.uid())
  );

-- FOLLOW_UP_SEQUENCES: Users can see sequences for their leads
CREATE POLICY "Users can view follow-up sequences for their leads" ON public.follow_up_sequences
  FOR SELECT USING (
    campaign_id IN (SELECT id FROM public.campaigns WHERE professional_id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can create follow-up sequences for their leads" ON public.follow_up_sequences
  FOR INSERT WITH CHECK (
    campaign_id IN (SELECT id FROM public.campaigns WHERE professional_id = auth.uid())
  );

-- LEAD_PURCHASES: Users can only see their own purchases; admins see all
CREATE POLICY "Users can view their own lead purchases" ON public.lead_purchases
  FOR SELECT USING (
    professional_id = auth.uid()
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Users can purchase leads" ON public.lead_purchases
  FOR INSERT WITH CHECK (professional_id = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp for profiles
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_verticals_updated_at
  BEFORE UPDATE ON public.verticals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pipeline_jobs_updated_at
  BEFORE UPDATE ON public.pipeline_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_follow_up_sequences_updated_at
  BEFORE UPDATE ON public.follow_up_sequences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on new auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'professional');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert Verticals (8 main sectors for lead generation)
INSERT INTO public.verticals (name, description, icon_emoji, ai_prompt, is_active)
VALUES
  (
    'Piscines & Spas',
    'Propriétaires de maisons avec piscines ou spas pour services d\'entretien et rénovation',
    '🏊',
    'You are a professional pool maintenance specialist. Generate compelling AI images of pristine, luxurious swimming pools with surrounding landscaping. Images should appeal to affluent homeowners interested in pool services, renovations, or upgrades. Include modern design elements, clear water, and professional landscaping.',
    true
  ),
  (
    'Panneaux Solaires',
    'Propriétaires pour installation de panneaux solaires et solutions énergétiques',
    '☀️',
    'You are a solar energy consultant. Generate professional AI images showcasing modern rooftop solar panel installations on residential homes. Include sunny backgrounds, energy efficiency indicators, and modern home aesthetics. Images should appeal to environmentally-conscious homeowners.',
    true
  ),
  (
    'Rénovation Intérieure',
    'Propriétaires cherchant des services de rénovation et décoration intérieure',
    '🏠',
    'You are an interior design expert. Generate stylish AI images of modern, renovated home interiors. Include contemporary furniture, lighting, color schemes, and design elements. Images should inspire homeowners to consider renovation projects.',
    true
  ),
  (
    'Toitures & Gouttières',
    'Propriétaires nécessitant services de réparation et remplacement de toitures',
    '🔨',
    'You are a roofing specialist. Generate professional images of quality roof installations and repairs. Include various roof styles, materials, and protective features. Images should emphasize durability and professional craftsmanship.',
    true
  ),
  (
    'Jardinerie & Paysagisme',
    'Propriétaires pour services de paysagisme et aménagement extérieur',
    '🌿',
    'You are a landscape designer. Generate beautiful AI images of professionally landscaped gardens and outdoor spaces. Include lush plants, modern garden designs, water features, and outdoor living areas. Images should appeal to homeowners wanting garden improvements.',
    true
  ),
  (
    'Fenêtres & Portes',
    'Propriétaires pour remplacement de fenêtres et portes modernes',
    '🪟',
    'You are a window and door specialist. Generate AI images showcasing modern window and door installations on residential homes. Include energy-efficient designs, contemporary styles, and enhanced curb appeal. Images should appeal to homeowners considering upgrades.',
    true
  ),
  (
    'Chauffage & Climatisation',
    'Propriétaires pour services de chauffage, climatisation et systèmes HVAC',
    '❄️',
    'You are an HVAC specialist. Generate professional images of modern heating and cooling systems, including modern thermostats, efficient units, and comfort solutions. Images should appeal to homeowners concerned with energy efficiency and comfort.',
    true
  ),
  (
    'Isolation Thermique',
    'Propriétaires pour amélioration de l\'isolation et efficacité énergétique',
    '🧊',
    'You are an energy efficiency consultant. Generate technical yet appealing images of thermal insulation solutions, modern insulation materials, energy-efficient homes, and sustainable building practices. Images should appeal to eco-conscious homeowners.',
    true
  );

-- Insert Email Templates
INSERT INTO public.email_templates (vertical_id, name, subject_line, body_html, from_name, from_email, is_default, is_active)
SELECT
  id,
  'Modèle Standard',
  'Découvrez nos services professionnels pour votre maison',
  '<html><body><h2>Bonjour,</h2><p>Nous offrons des services professionnels de qualité pour améliorer votre propriété.</p><p>Contactez-nous pour une consultation gratuite sans engagement.</p><p>Cordialement,<br/>L\'équipe professionnelle</p></body></html>',
  'Services Professionnels',
  'contact@services.fr',
  true,
  true
FROM public.verticals
WHERE name = 'Piscines & Spas'
LIMIT 1;

INSERT INTO public.email_templates (vertical_id, name, subject_line, body_html, from_name, from_email, is_default, is_active)
SELECT
  id,
  'Modèle Énergie',
  'Réduisez votre facture énergétique avec nos solutions durables',
  '<html><body><h2>Bonjour,</h2><p>Investir dans l\'énergie renouvelable est un choix intelligent pour votre foyer.</p><p>Découvrez comment nos solutions peuvent vous faire économiser jusqu\'à 50% sur votre facture.</p><p>Devis gratuit sans engagement.<br/>L\'équipe Énergie</p></body></html>',
  'Solutions Énergétiques',
  'energy@solutions.fr',
  true,
  true
FROM public.verticals
WHERE name = 'Panneaux Solaires'
LIMIT 1;

INSERT INTO public.email_templates (vertical_id, name, subject_line, body_html, from_name, from_email, is_default, is_active)
SELECT
  id,
  'Modèle Standard',
  'Transformez votre maison en espace de vie idéal',
  '<html><body><h2>Bonjour,</h2><p>Votre maison mérite d\'être un lieu où il fait bon vivre.</p><p>Explorez nos services et laissez-nous vous aider à créer l\'espace de vos rêves.</p><p>Consultation gratuite.<br/>Votre équipe de professionnels</p></body></html>',
  'Rénov Maison',
  'renovation@maison.fr',
  false,
  true
FROM public.verticals
WHERE name = 'Rénovation Intérieure'
LIMIT 1;

-- ============================================================================
-- EXTENSIONS FOR GEOGRAPHIC QUERIES
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "earthdistance" CASCADE;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
