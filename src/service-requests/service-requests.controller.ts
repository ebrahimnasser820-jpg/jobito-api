import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service.js';
import { CreateServiceRequestDto } from './dto/create-service-request.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';

@Controller('service-requests')
@UseGuards(JwtAuthGuard)
export class ServiceRequestsController {
  constructor(private readonly serviceRequestsService: ServiceRequestsService) {}

  @Post()
  async createRequest(@Req() req: any, @Body() dto: CreateServiceRequestDto) {
    return this.serviceRequestsService.create(req.user.sub, dto);
  }

  @Get()
  async getMyRequests(@Req() req: any) {
    return this.serviceRequestsService.findAllForUser(req.user.sub);
  }

  @Get(':id')
  async getRequestDetails(@Param('id') id: string) {
    return this.serviceRequestsService.findOne(Number(id));
  }
}
