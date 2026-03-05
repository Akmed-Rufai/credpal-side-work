import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async createProfile(
    userId: string,
    data: Omit<Prisma.ProfileCreateInput, 'user'>,
  ) {
    return this.prisma.profile.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
      },
    });
  }

  async getProfile(userId: string) {
    return this.prisma.profile.findUnique({
      where: { user_id: userId },
    });
  }
}
