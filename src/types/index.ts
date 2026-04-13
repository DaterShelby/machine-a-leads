/**
 * Core type definitions for Machine a Leads platform
 */

// Campaign and Lead types
export interface Campaign {
  id: string;
  name: string;
  description?: string;
  vertical: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  communes: string[];
  minPrice?: number;
  maxPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lead {
  id: string;
  campaignId: string;
  address: string;
  latitude: number;
  longitude: number;
  price?: number;
  surface?: number;
  propertyType?: string;
  email?: string;
  phone?: string;
  satellite_image_url?: string;
  generated_image_url?: string;
  email_sent: boolean;
  email_status?: 'pending' | 'sent' | 'bounced' | 'opened' | 'clicked';
  createdAt: Date;
  updatedAt: Date;
}

export interface VerticalConfig {
  name: string;
  displayName: string;
  description: string;
  prompt: string;
  emailTemplate?: string;
  targetKeywords?: string[];
  priorityFilters?: Record<string, any>;
}

// DVF Service types
export interface DVFSearchParams {
  communes?: string[];
  codePostal?: string;
  minPrice?: number;
  maxPrice?: number;
  minSurface?: number;
  maxSurface?: number;
  limit?: number;
  offset?: number;
}

export interface DVFProperty {
  id?: string;
  address: string;
  commune: string;
  codePostal: string;
  departement: string;
  latitude?: number;
  longitude?: number;
  price: number;
  surface: number;
  typeLocal: string;
  typeTransaction: string;
  dateTransaction: string;
  rawData?: Record<string, any>;
}

// Satellite Image Service types
export interface SatelliteOptions {
  zoom?: number;
  size?: string;
  maptype?: 'satellite' | 'terrain' | 'roadmap' | 'hybrid';
}

// AI Generator Service types
export interface ImageGenerationOptions {
  prompt?: string;
  strength?: number;
  seedId?: number;
}

// Email Service types
export interface EmailParams {
  to: EmailAddress;
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender: EmailAddress;
  tags?: string[];
  replyTo?: EmailAddress;
  templateId?: string;
  templateParams?: Record<string, string>;
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface EmailResult {
  messageId: string;
  success: boolean;
  error?: string;
}

export interface BatchResult {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{ leadId: string; error: string }>;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  variables: string[];
}

export interface EmailEvent {
  type: 'sent' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  leadId: string;
  campaignId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Pipeline Service types
export type PipelineStep =
  | 'collect_data'
  | 'fetch_satellites'
  | 'generate_images'
  | 'send_emails'
  | 'track_analytics';

export interface PipelineJob {
  id: string;
  campaignId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep?: PipelineStep;
  progress: {
    total: number;
    processed: number;
    failed: number;
  };
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  logs: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}
