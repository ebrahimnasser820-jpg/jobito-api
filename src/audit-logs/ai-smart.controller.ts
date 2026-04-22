import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { AiSmartService } from './ai-smart.service.js';
import { AiAnalyticsService } from './ai-analytics.service.js';

@Controller('ai')
export class AiSmartController {
  constructor(
    private aiSmartService: AiSmartService,
    private aiAnalyticsService: AiAnalyticsService,
  ) {}

  // ─── Smart Search ──────────────────────────────────────────
  @Get('smart-search')
  async smartSearch(
    @Query('q') query: string,
    @Query('location') location?: string,
    @Query('jobType') jobType?: string,
    @Query('categoryId') categoryId?: string,
    @Query('classification') classification?: string,
    @Query('excludeClassification') excludeClassification?: string,
  ) {
    if (!query || query.trim() === '') {
      return { data: [], query: '', expandedTags: [], total: 0, message: 'Please provide a search query' };
    }

    const result = await this.aiSmartService.smartSearch(query, { 
      location, 
      jobType, 
      categoryId,
      classification,
      excludeClassification
    });
    return result;
  }

  // ─── Auto-Tag a Job ────────────────────────────────────────
  @Post('auto-tag')
  autoTag(@Body() body: { title: string; description?: string }) {
    const tags = this.aiSmartService.autoTagJob(body.title, body.description);
    return { title: body.title, tags };
  }

  // ─── Expand Query to Tags (Debug/Test) ─────────────────────
  @Get('expand-query')
  expandQuery(@Query('q') query: string) {
    const tags = this.aiSmartService.expandQuery(query || '');
    return { query, expandedTags: tags };
  }

  // ─── Score CV Match ────────────────────────────────────────
  @Post('score-cv')
  scoreCv(@Body() body: {
    userSkills: string[];
    userBio?: string;
    jobTitle: string;
    jobDescription: string;
  }) {
    return this.aiSmartService.scoreCvMatch(
      body.userSkills,
      body.userBio || '',
      body.jobTitle,
      body.jobDescription,
    );
  }

  // ─── Generate Job Description ──────────────────────────────
  @Post('generate-job-desc')
  generateJobDesc(@Body() body: {
    title: string;
    category?: string;
    experience?: string;
    location?: string;
  }) {
    const description = this.aiSmartService.generateJobDescription(body);
    return { description };
  }

  // ─── Generate Cover Letter ─────────────────────────────────
  @Post('cover-letter')
  generateCoverLetter(@Body() body: {
    userName: string;
    userSkills: string[];
    userExperience?: number;
    jobTitle: string;
    companyName?: string;
  }) {
    const letter = this.aiSmartService.generateCoverLetter(body);
    return { letter };
  }

  // ─── Analytics: Top Searches ───────────────────────────────
  @Get('analytics/top-searches')
  async topSearches(@Query('days') days?: string) {
    return this.aiAnalyticsService.getTopSearches(days ? parseInt(days) : 7);
  }

  // ─── Analytics: Top Companies ──────────────────────────────
  @Get('analytics/top-companies')
  async topCompanies(@Query('days') days?: string) {
    return this.aiAnalyticsService.getTopVisitedCompanies(days ? parseInt(days) : 7);
  }

  // ─── Analytics: Top Jobs ───────────────────────────────────
  @Get('analytics/top-jobs')
  async topJobs(@Query('days') days?: string) {
    return this.aiAnalyticsService.getTopViewedJobs(days ? parseInt(days) : 7);
  }

  // ─── Analytics: Traffic Summary ────────────────────────────
  @Get('analytics/traffic')
  async trafficSummary(@Query('days') days?: string) {
    return this.aiAnalyticsService.getTrafficSummary(days ? parseInt(days) : 7);
  }

  // ─── Analytics: Send Full Report via Email ─────────────────
  @Post('analytics/send-report')
  async sendReport(@Body() body: { days?: number }) {
    return this.aiAnalyticsService.generateAndSendReport(body.days || 7);
  }
}
