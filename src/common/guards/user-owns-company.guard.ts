import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CompaniesService } from '../../companies/companies.service.js';

@Injectable()
export class UserOwnsCompanyGuard implements CanActivate {
  constructor(private companiesService: CompaniesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const companyIdFromParams = parseInt(request.params.id);

    if (!user || user.role !== 'company') {
      throw new ForbiddenException('Only company accounts can access this resource');
    }

    if (!companyIdFromParams) {
      return true; // If no ID in params, we might be creating or accessing a general route
    }

    // Find company by contact email associated with the authenticated user
    const company = await this.companiesService.findByContactEmailOrName(user.email);
    
    if (!company) {
      throw new NotFoundException('Your company profile was not found');
    }

    if (Number(company.companyId) !== companyIdFromParams) {
      throw new ForbiddenException('You do not have permission to modify this company profile');
    }

    return true;
  }
}
