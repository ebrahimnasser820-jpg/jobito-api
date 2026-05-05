import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemRequest, SystemRequestStatus, SystemRequestType } from '../entities/system-request.entity.js';
import { Admin, AdminRole } from '../entities/admin.entity.js';
import { AdminAuthService } from './admin-auth.service.js';

@Injectable()
export class AdminSystemRequestService {
  constructor(
    @InjectRepository(SystemRequest)
    private requestRepo: Repository<SystemRequest>,
    @InjectRepository(Admin)
    private adminRepo: Repository<Admin>,
    private adminAuthService: AdminAuthService,
  ) {}

  async createRequest(requesterId: string, data: { requestType: SystemRequestType; candidateName: string; candidateEmail: string; reason?: string }) {
    const request = this.requestRepo.create({ requesterId, ...data });
    const saved = await this.requestRepo.save(request);
    await this.adminAuthService.logActivity(requesterId, 'CREATE_SYSTEM_REQUEST', 'SystemRequest', String(saved.requestId), `Requested to add ${data.candidateName} as ${data.requestType}`);
    return { message: 'System request submitted for review', requestId: saved.requestId };
  }

  async listRequests(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const requests = await this.requestRepo.find({ where, relations: ['requester'], order: { createdAt: 'DESC' } });
    return {
      data: requests.map(r => ({
        requestId: r.requestId, requestType: r.requestType, candidateName: r.candidateName,
        candidateEmail: r.candidateEmail, reason: r.reason, status: r.status,
        requesterName: r.requester?.fullName, createdAt: r.createdAt,
      })),
    };
  }

  async reviewRequest(reviewerId: string, requestId: number, action: 'approve' | 'reject', reviewNote?: string) {
    const request = await this.requestRepo.findOne({ where: { requestId } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== SystemRequestStatus.PENDING) throw new BadRequestException('Request already reviewed');

    const reviewer = await this.adminRepo.findOne({ where: { adminId: reviewerId } });
    if (!reviewer || reviewer.role !== AdminRole.SUPER_ADMIN) throw new BadRequestException('Only Super Admins can review requests');

    request.status = action === 'approve' ? SystemRequestStatus.APPROVED : SystemRequestStatus.REJECTED;
    request.reviewedBy = reviewerId;
    request.reviewNote = reviewNote || null;
    await this.requestRepo.save(request);

    if (action === 'approve') {
      await this.adminAuthService.inviteAdmin(reviewerId, request.candidateName, request.candidateEmail, AdminRole.OPERATION_MANAGER);
    }

    await this.adminAuthService.logActivity(reviewerId, action === 'approve' ? 'APPROVE_REQUEST' : 'REJECT_REQUEST', 'SystemRequest', String(requestId), `${action} system request for ${request.candidateName}`);
    return { message: `Request ${action}d successfully` };
  }
}
