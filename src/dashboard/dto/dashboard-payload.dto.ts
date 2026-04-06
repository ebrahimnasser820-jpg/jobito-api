// src/dashboard/dto/dashboard-payload.dto.ts

export class DashboardPayloadDto {
  days?: number = 7;
  jobs?: any[] = [];
  applicants?: any[] = [];
  dailyStats?: any[] = [];
  jobUpdates?: any[] = [];
}
