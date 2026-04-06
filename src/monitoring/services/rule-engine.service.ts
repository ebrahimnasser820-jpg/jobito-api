import { Injectable } from '@nestjs/common';

export interface AnalysisResult {
  errorType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  solution: string;
  description: string;
}

@Injectable()
export class RuleEngineService {
  /**
   * Analyzes an error message or object and returns structured insights.
   */
  async analyze(errorMessage: string, frequency: number): Promise<AnalysisResult> {
    let errorType = 'Unknown Issue';
    let severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let solution = 'Please check the system logs for more details.';
    let description = errorMessage;

    // Rule 1: Frequency Threshold
    if (frequency > 20) {
      severity = 'HIGH';
      description = `High frequency error detected: ${errorMessage}`;
    }

    // Rule 2: Database Connectivity
    if (errorMessage.includes('ECONNREFUSED')) {
      errorType = 'Database Connection Issue';
      severity = severity === 'HIGH' ? 'HIGH' : 'MEDIUM';
      solution = 'Check if the PostgreSQL database is running and the connection string is correct.';
    }

    // Rule 3: Internal Server Error (500)
    if (errorMessage.includes('500') || errorMessage.toLowerCase().includes('internal server error')) {
      errorType = 'Server Internal Error';
      severity = severity === 'HIGH' ? 'HIGH' : 'MEDIUM';
      solution = 'Investigate the backend logs to find the specific line causing the crash.';
    }

    // Rule 4: Authentication Failures
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
      errorType = 'Authentication Failure';
      severity = 'LOW';
      solution = 'Ensure the user has valid credentials and the token is not expired.';
    }

    // Rule 5: Resource Not Found
    if (errorMessage.includes('NotFound') || errorMessage.includes('404')) {
      errorType = 'Resource Not Found';
      severity = 'LOW';
      solution = 'Check if the requested URL or resource ID exists in the database.';
    }

    return {
      errorType,
      severity,
      solution,
      description,
    };
  }
}
