import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MonitoringReport, Severity } from '../entities/monitoring-report.entity.js';
import { RuleEngineService } from './rule-engine.service.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(MonitoringReport)
    private reportRepo: Repository<MonitoringReport>,
    private ruleEngine: RuleEngineService,
  ) {}

  /**
   * Generates a new monitoring report or updates an existing one if the same error is frequent.
   */
  async generateReport(error: string, frequency: number, metadata: any) {
    const analysis = await this.ruleEngine.analyze(error, frequency);

    // Save report to DB
    const report = this.reportRepo.create({
      errorType: analysis.errorType,
      description: analysis.description,
      frequency,
      severity: analysis.severity as Severity,
      suggestedSolution: analysis.solution,
      metadata,
    });

    return await this.reportRepo.save(report);
  }

  async getReports() {
    return await this.reportRepo.find({
      order: { createdAt: 'DESC' },
    });
  }
}
