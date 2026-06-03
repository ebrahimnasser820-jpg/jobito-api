import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequest } from './service-request.entity.js';
import { CreateServiceRequestDto } from './dto/create-service-request.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectRepository(ServiceRequest)
    private serviceRequestRepository: Repository<ServiceRequest>,
    private notificationsService: NotificationsService,
  ) {}

  async create(requesterId: string, dto: CreateServiceRequestDto) {
    const request = this.serviceRequestRepository.create({
      requesterId,
      tradesmanId: dto.tradesmanId,
      description: dto.description,
    });
    
    const savedRequest = await this.serviceRequestRepository.save(request);

    // Notify the tradesman
    await this.notificationsService.createNotification(
      dto.tradesmanId,
      'New Service Request',
      `You have received a new service request.`,
      'service_request',
      `/service-requests/${savedRequest.id}`
    );

    return savedRequest;
  }

  async findAllForUser(userId: string) {
    return this.serviceRequestRepository.find({
      where: [
        { requesterId: userId },
        { tradesmanId: userId }
      ],
      relations: ['requester', 'tradesman'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: number) {
    const request = await this.serviceRequestRepository.findOne({
      where: { id },
      relations: ['requester', 'tradesman']
    });
    if (!request) throw new NotFoundException('Service request not found');
    return request;
  }
}
