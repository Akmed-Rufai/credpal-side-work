import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  AddMemberDto,
} from './dto/organizations.dto';
import { OrgRole } from '@prisma/client';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async createOrganization(userId: string, data: CreateOrganizationDto) {
    const existing = await this.prisma.organization.findUnique({
      where: { slug: data.slug },
    });
    if (existing)
      throw new ConflictException('Organization alias/slug already taken');

    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: data.name,
          slug: data.slug,
          logo_url: data.logoUrl,
          brand_color: data.brandColor,
          owner_id: userId,
        },
      });

      await tx.orgMember.create({
        data: {
          org_id: org.id,
          user_id: userId,
          role: OrgRole.ADMIN,
        },
      });

      return org;
    });
  }

  async getUserOrganizations(userId: string) {
    return this.prisma.organization.findMany({
      where: {
        members: {
          some: { user_id: userId },
        },
      },
      include: {
        _count: {
          select: { members: true, programs: true },
        },
      },
    });
  }

  async getOrganizationById(orgId: string, userId: string) {
    const org = await this.prisma.organization.findFirst({
      where: {
        id: orgId,
        members: {
          some: { user_id: userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, profile: true },
            },
          },
        },
      },
    });

    if (!org)
      throw new NotFoundException('Organization not found or access denied');
    return org;
  }

  async updateOrganization(
    orgId: string,
    userId: string,
    data: UpdateOrganizationDto,
  ) {
    const membership = await this.prisma.orgMember.findUnique({
      where: { org_id_user_id: { org_id: orgId, user_id: userId } },
    });

    if (!membership || membership.role !== OrgRole.ADMIN) {
      throw new ForbiddenException('Only admins can update the organization');
    }

    if (data.slug) {
      const existing = await this.prisma.organization.findFirst({
        where: { slug: data.slug, id: { not: orgId } },
      });
      if (existing) throw new ConflictException('Slug is already taken');
    }

    return this.prisma.organization.update({
      where: { id: orgId },
      data: {
        name: data.name,
        slug: data.slug,
        logo_url: data.logoUrl,
        brand_color: data.brandColor,
      },
    });
  }

  async addMember(orgId: string, adminId: string, data: AddMemberDto) {
    const adminMembership = await this.prisma.orgMember.findUnique({
      where: { org_id_user_id: { org_id: orgId, user_id: adminId } },
    });

    if (!adminMembership || adminMembership.role !== OrgRole.ADMIN) {
      throw new ForbiddenException('Only admins can add members');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!targetUser) {
      throw new NotFoundException(
        'User with this email not found in the platform',
      );
    }

    const existingMembership = await this.prisma.orgMember.findUnique({
      where: { org_id_user_id: { org_id: orgId, user_id: targetUser.id } },
    });

    if (existingMembership) {
      throw new ConflictException(
        'User is already a member of this organization',
      );
    }

    return this.prisma.orgMember.create({
      data: {
        org_id: orgId,
        user_id: targetUser.id,
        role: data.role as OrgRole,
      },
    });
  }

  async removeMember(orgId: string, adminId: string, memberId: string) {
    const adminMembership = await this.prisma.orgMember.findUnique({
      where: { org_id_user_id: { org_id: orgId, user_id: adminId } },
    });

    if (!adminMembership || adminMembership.role !== OrgRole.ADMIN) {
      throw new ForbiddenException('Only admins can remove members');
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (org?.owner_id === memberId) {
      throw new ForbiddenException('Cannot remove the organization owner');
    }

    try {
      await this.prisma.orgMember.delete({
        where: { org_id_user_id: { org_id: orgId, user_id: memberId } },
      });
      return { success: true };
    } catch (error) {
      throw new NotFoundException('Member not found in organization');
    }
  }
}
