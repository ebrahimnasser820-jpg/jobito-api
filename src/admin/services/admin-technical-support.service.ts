import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from '../entities/support-ticket.entity.js';
import { SupportMessage } from '../entities/support-message.entity.js';
import { AdminAuthService } from './admin-auth.service.js';

@Injectable()
export class AdminTechnicalSupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private ticketRepo: Repository<SupportTicket>,
    @InjectRepository(SupportMessage)
    private messageRepo: Repository<SupportMessage>,
    private adminAuthService: AdminAuthService,
  ) {}

  async listTickets(status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const tickets = await this.ticketRepo.find({ where, order: { updatedAt: 'DESC' } });
    return { data: tickets };
  }

  async getTicketMessages(ticketId: number) {
    const ticket = await this.ticketRepo.findOne({ where: { ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    const messages = await this.messageRepo.find({ where: { ticketId }, order: { createdAt: 'ASC' } });
    return { ticket, messages };
  }

  async replyToTicket(adminId: string, ticketId: number, content: string) {
    const ticket = await this.ticketRepo.findOne({ where: { ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    ticket.status = 'in_progress';
    ticket.assignedAdminId = adminId;
    await this.ticketRepo.save(ticket);
    const message = this.messageRepo.create({ ticketId, senderId: adminId, senderType: 'admin', content });
    await this.messageRepo.save(message);
    await this.adminAuthService.logActivity(adminId, 'REPLY_TICKET', 'SupportTicket', String(ticketId), `Replied to support ticket: ${ticket.subject}`);
    return { message: 'Reply sent successfully', data: message };
  }

  async closeTicket(adminId: string, ticketId: number) {
    const ticket = await this.ticketRepo.findOne({ where: { ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    ticket.status = 'closed';
    await this.ticketRepo.save(ticket);
    await this.adminAuthService.logActivity(adminId, 'CLOSE_TICKET', 'SupportTicket', String(ticketId), `Closed support ticket: ${ticket.subject}`);
    return { message: 'Ticket closed' };
  }

  // Public: create ticket from user side
  async createTicket(userId: string, userName: string, userEmail: string, subject: string) {
    const ticket = this.ticketRepo.create({ userId, userName, userEmail, subject });
    return this.ticketRepo.save(ticket);
  }

  async addUserMessage(ticketId: number, userId: string, content: string) {
    const ticket = await this.ticketRepo.findOne({ where: { ticketId } });
    if (!ticket || ticket.userId !== userId) throw new NotFoundException('Ticket not found');
    const message = this.messageRepo.create({ ticketId, senderId: userId, senderType: 'user', content });
    return this.messageRepo.save(message);
  }
}
