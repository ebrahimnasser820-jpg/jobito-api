import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity.js';
import { InjectRepository } from '@nestjs/typeorm';
import { AppGateway } from '../common/gateways/app.gateway.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly gateway: AppGateway,
  ) { }

  findAll() {
    return this.usersRepository.find();
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  findByGoogleId(googleId: string) {
    return this.usersRepository.findOne({ where: { googleId } });
  }

  async create(userData: Partial<User>) {
    const user = this.usersRepository.create(userData);
    const updatedUser = await this.usersRepository.save(user);

    // Broadcast update via WebSocket
    this.gateway.notifyUserUpdate(updatedUser.userId, {
      userId: updatedUser.userId,
      fullName: updatedUser.fullName,
      avatarUrl: updatedUser.avatarUrl,
    });

    return updatedUser;
  }

  findById(userId: string) {
    return this.usersRepository.findOne({ where: { userId } });
  }

  async update(userId: string, data: Partial<User>) {
    await this.usersRepository.update(userId, data);
    const updatedUser = await this.findById(userId);

    if (updatedUser) {
      this.gateway.notifyUserUpdate(userId, {
        userId: userId,
        fullName: updatedUser.fullName,
        avatarUrl: updatedUser.avatarUrl,
      });
    }

    return updatedUser;
  }

  async remove(userId: string) {
    const user = await this.findById(userId);
    if (user) {
      return await this.usersRepository.remove(user);
    }
    return null;
  }
}
