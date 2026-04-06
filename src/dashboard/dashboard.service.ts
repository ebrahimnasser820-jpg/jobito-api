import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { DashboardPayloadDto } from './dto/dashboard-payload.dto';

@Injectable()
export class DashboardService {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('DASHBOARD_API_URL') || 'https://localhost:7196';
    this.apiKey = this.configService.get<string>('DASHBOARD_API_KEY') || '';
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'X-Api-Key': this.apiKey,
    };
  }

  async getDashboardStats(payload: DashboardPayloadDto) {
    return this.makeRequest('/api/company/dashboard/stats', payload);
  }

  async getApplicantSummary(payload: DashboardPayloadDto) {
    return this.makeRequest('/api/company/dashboard/applicants-summary', payload);
  }

  async getJobUpdates(payload: DashboardPayloadDto) {
    return this.makeRequest('/api/company/dashboard/job-updates', payload);
  }

  async getJobListingStats(payload: DashboardPayloadDto) {
    return this.makeRequest('/api/company/dashboard/job-listing-stats', payload);
  }

  private async makeRequest(endpoint: string, payload: DashboardPayloadDto) {
    try {
      const response = await firstValueFrom<any>(
        this.httpService.post(`${this.baseUrl}${endpoint}`, payload, {
          headers: this.headers,
        }),
      );
      return response.data;
    } catch (error) {
      console.error(`Error communicating with Dashboard API (${endpoint}):`, error?.response?.data || error.message);
      throw new InternalServerErrorException('Failed to fetch dashboard data from analytics service');
    }
  }
}
