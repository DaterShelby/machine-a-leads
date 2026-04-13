/**
 * Pipeline Orchestration Service
 *
 * Orchestrates the full lead generation pipeline:
 * 1. Collect property data from DVF
 * 2. Fetch satellite images
 * 3. Generate AI-improved images
 * 4. Send personalized emails
 * 5. Track analytics
 */

import { Campaign, Lead, PipelineJob, PipelineStep, DVFProperty } from '@/types';
import * as dvfService from './dvf';
import * as satelliteService from './satellite';
import * as aiGeneratorService from './ai-generator';
import * as emailService from './email';

const BATCH_SIZE = parseInt(process.env.PIPELINE_BATCH_SIZE || '10');
const JOB_TIMEOUT_MS = parseInt(process.env.PIPELINE_JOB_TIMEOUT || '3600000');

/**
 * Logs messages with service context
 */
function log(message: string, data?: any) {
  console.log(`[Pipeline] ${message}`, data || '');
}

function logError(message: string, error?: any) {
  console.error(`[Pipeline] ERROR: ${message}`, error || '');
}

/**
 * In-memory job storage (replace with database in production)
 */
const jobStore = new Map<string, PipelineJob>();

/**
 * Generates a unique job ID
 */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a new pipeline job
 */
function createJob(campaignId: string): PipelineJob {
  return {
    id: generateJobId(),
    campaignId,
    status: 'pending',
    progress: {
      total: 0,
      processed: 0,
      failed: 0,
    },
    logs: [],
  };
}

/**
 * Adds a log entry to a job
 */
function addLog(jobId: string, message: string): void {
  const job = jobStore.get(jobId);
  if (job) {
    const timestamp = new Date().toISOString();
    job.logs.push(`[${timestamp}] ${message}`);
  }
}

/**
 * Updates job progress
 */
function updateProgress(
  jobId: string,
  total?: number,
  processed?: number,
  failed?: number
): void {
  const job = jobStore.get(jobId);
  if (job) {
    if (total !== undefined) job.progress.total = total;
    if (processed !== undefined) job.progress.processed = processed;
    if (failed !== undefined) job.progress.failed = failed;
  }
}

/**
 * Starts a new pipeline job for a campaign
 *
 * @param campaignId - Campaign to process
 * @returns Created job with ID and initial status
 */
export function startPipeline(campaignId: string): PipelineJob {
  try {
    log(`Starting pipeline for campaign: ${campaignId}`);

    const job = createJob(campaignId);
    jobStore.set(job.id, job);

    addLog(job.id, `Pipeline started for campaign ${campaignId}`);

    return job;
  } catch (error) {
    logError(`Failed to start pipeline for campaign ${campaignId}`, error);
    throw error;
  }
}

/**
 * Retrieves job status
 *
 * @param jobId - Job ID
 * @returns Job object with current status
 * @throws Error if job not found
 */
export function getJobStatus(jobId: string): PipelineJob {
  const job = jobStore.get(jobId);
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }
  return job;
}

/**
 * Cancels a running job
 *
 * @param jobId - Job ID to cancel
 */
export function cancelJob(jobId: string): void {
  const job = jobStore.get(jobId);
  if (job) {
    job.status = 'cancelled';
    addLog(jobId, 'Job cancelled by user');
    log(`Job cancelled: ${jobId}`);
  }
}

/**
 * Processes items in batches with a processor function
 *
 * @param items - Items to process
 * @param batchSize - Number of items per batch
 * @param processor - Function to process each item
 * @param jobId - Optional job ID for progress tracking
 */
export async function processInBatches<T>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<void>,
  jobId?: string
): Promise<void> {
  try {
    log(`Processing ${items.length} items in batches of ${batchSize}`);

    if (jobId) {
      updateProgress(jobId, items.length, 0, 0);
    }

    for (let i = 0; i < items.length; i += batchSize) {
      // Check if job was cancelled
      if (jobId) {
        const job = jobStore.get(jobId);
        if (job?.status === 'cancelled') {
          addLog(jobId, 'Processing cancelled');
          throw new Error('Job was cancelled');
        }
      }

      const batch = items.slice(i, i + batchSize);
      let batchFailed = 0;

      for (const item of batch) {
        try {
          await processor(item);
          if (jobId) {
            updateProgress(jobId, undefined, i + batch.indexOf(item) + 1);
          }
        } catch (error) {
          logError('Batch item processing failed', error);
          batchFailed++;
        }
      }

      if (jobId) {
        const job = jobStore.get(jobId);
        if (job) {
          job.progress.failed += batchFailed;
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + batchSize < items.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    if (jobId) {
      addLog(jobId, `Batch processing complete`);
    }
  } catch (error) {
    logError('Batch processing failed', error);
    throw error;
  }
}

/**
 * Executes a specific step of the pipeline
 *
 * @param jobId - Job ID
 * @param step - Pipeline step to execute
 * @throws Error if execution fails
 */
export async function executePipelineStep(
  jobId: string,
  step: PipelineStep
): Promise<void> {
  try {
    const job = getJobStatus(jobId);
    log(`Executing step: ${step}`, { jobId });

    job.currentStep = step;
    job.status = 'running';
    addLog(jobId, `Starting step: ${step}`);

    switch (step) {
      case 'collect_data':
        await executeCollectData(jobId);
        break;
      case 'fetch_satellites':
        await executeFetchSatellites(jobId);
        break;
      case 'generate_images':
        await executeGenerateImages(jobId);
        break;
      case 'send_emails':
        await executeSendEmails(jobId);
        break;
      case 'track_analytics':
        await executeTrackAnalytics(jobId);
        break;
      default:
        throw new Error(`Unknown pipeline step: ${step}`);
    }

    addLog(jobId, `Step completed: ${step}`);
  } catch (error) {
    logError(`Pipeline step failed: ${step}`, error);
    const job = jobStore.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
    }
    throw error;
  }
}

/**
 * Step 1: Collect property data from DVF
 */
async function executeCollectData(jobId: string): Promise<void> {
  try {
    const job = getJobStatus(jobId);
    addLog(jobId, 'Collecting property data from DVF...');

    // TODO: Fetch campaign details from database
    // const campaign = await getcampaign(job.campaignId);

    // For now, using mock data
    const searchParams = {
      limit: 50,
    };

    const properties = await dvfService.searchProperties(searchParams);
    addLog(jobId, `Found ${properties.length} properties from DVF`);

    updateProgress(jobId, properties.length, 0, 0);
  } catch (error) {
    logError('Failed to collect data', error);
    throw error;
  }
}

/**
 * Step 2: Fetch satellite images
 */
async function executeFetchSatellites(jobId: string): Promise<void> {
  try {
    const job = getJobStatus(jobId);
    addLog(jobId, 'Fetching satellite images...');

    // TODO: Get leads from database for this campaign
    // const leads = await getLeadsForCampaign(job.campaignId);

    // Mock implementation
    const mockLeads: Lead[] = [];

    await processInBatches(
      mockLeads,
      BATCH_SIZE,
      async (lead) => {
        if (lead.latitude && lead.longitude) {
          const imageUrl = await satelliteService.getSatelliteImage(
            lead.latitude,
            lead.longitude,
            lead.id
          );
          // TODO: Update lead with satellite_image_url
          addLog(jobId, `Fetched satellite for lead ${lead.id}`);
        }
      },
      jobId
    );

    addLog(jobId, 'Satellite image fetching complete');
  } catch (error) {
    logError('Failed to fetch satellites', error);
    throw error;
  }
}

/**
 * Step 3: Generate AI-improved images
 */
async function executeGenerateImages(jobId: string): Promise<void> {
  try {
    const job = getJobStatus(jobId);
    addLog(jobId, 'Generating AI-improved images...');

    // TODO: Get leads with satellite images for this campaign
    // const leads = await getLeadsWithSatellites(job.campaignId);

    // Mock implementation
    const mockLeads: Lead[] = [];

    await processInBatches(
      mockLeads,
      BATCH_SIZE,
      async (lead) => {
        if (lead.satellite_image_url) {
          // TODO: Get vertical config
          const vertical = {
            name: 'piscine',
            displayName: 'Piscine',
            description: 'Swimming pool installations',
            prompt: 'A beautiful swimming pool',
          };

          const generatedUrl = await aiGeneratorService.generateAndUploadImage(
            lead.satellite_image_url,
            lead.id,
            vertical
          );

          // TODO: Update lead with generated_image_url
          addLog(jobId, `Generated image for lead ${lead.id}`);
        }
      },
      jobId
    );

    addLog(jobId, 'Image generation complete');
  } catch (error) {
    logError('Failed to generate images', error);
    throw error;
  }
}

/**
 * Step 4: Send personalized emails
 */
async function executeSendEmails(jobId: string): Promise<void> {
  try {
    const job = getJobStatus(jobId);
    addLog(jobId, 'Sending personalized emails...');

    // TODO: Get leads ready for email for this campaign
    // const leads = await getLeadsReadyForEmail(job.campaignId);

    // Mock implementation
    const mockLeads: Lead[] = [];

    await processInBatches(
      mockLeads,
      BATCH_SIZE,
      async (lead) => {
        if (lead.email) {
          const result = await emailService.sendEmail({
            to: {
              email: lead.email,
              name: lead.id,
            },
            subject: 'Nouvelle opportunité: Amélioration de votre propriété',
            htmlContent: `<p>Découvrez comment votre propriété pourrait être améliorée.</p>`,
            sender: {
              email: process.env.BREVO_SENDER_EMAIL || 'noreply@machinealeads.fr',
              name: 'Machine a Leads',
            },
            tags: ['pipeline', job.campaignId],
          });

          if (result.success) {
            // TODO: Update lead email_sent status
            addLog(jobId, `Email sent to ${lead.email}`);
          } else {
            addLog(jobId, `Failed to send email to ${lead.email}`);
          }
        }
      },
      jobId
    );

    addLog(jobId, 'Email sending complete');
  } catch (error) {
    logError('Failed to send emails', error);
    throw error;
  }
}

/**
 * Step 5: Track analytics
 */
async function executeTrackAnalytics(jobId: string): Promise<void> {
  try {
    const job = getJobStatus(jobId);
    addLog(jobId, 'Tracking analytics...');

    // Get email statistics
    const stats = emailService.getEmailStats(job.campaignId);

    addLog(jobId, `Campaign stats: ${JSON.stringify(stats)}`);

    // TODO: Store analytics in database
    // await storeAnalytics(job.campaignId, stats);

    job.status = 'completed';
    job.completedAt = new Date();
    addLog(jobId, 'Pipeline execution complete');

    log(`Pipeline completed successfully`, { jobId, stats });
  } catch (error) {
    logError('Failed to track analytics', error);
    throw error;
  }
}

/**
 * Executes the full pipeline end-to-end
 *
 * @param campaignId - Campaign to process
 * @returns Final job status
 */
export async function executeFullPipeline(campaignId: string): Promise<PipelineJob> {
  try {
    log(`Executing full pipeline for campaign: ${campaignId}`);

    const job = startPipeline(campaignId);

    const steps: PipelineStep[] = [
      'collect_data',
      'fetch_satellites',
      'generate_images',
      'send_emails',
      'track_analytics',
    ];

    for (const step of steps) {
      if (job.status === 'cancelled') {
        break;
      }

      try {
        await executePipelineStep(job.id, step);
      } catch (error) {
        logError(`Step ${step} failed, continuing with next step`, error);
      }
    }

    return getJobStatus(job.id);
  } catch (error) {
    logError(`Full pipeline execution failed for campaign ${campaignId}`, error);
    throw error;
  }
}

export type { PipelineJob, PipelineStep };
