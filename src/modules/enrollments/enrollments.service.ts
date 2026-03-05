import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EnrollmentStatus, OrgRole } from '@prisma/client';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) { }

  async enrollInCohort(userId: string, cohortId: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
    });
    if (!cohort) throw new NotFoundException('Cohort not found');

    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        user_id_cohort_id: {
          user_id: userId,
          cohort_id: cohortId,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('User is already enrolled in this cohort');
    }

    return this.prisma.enrollment.create({
      data: {
        user_id: userId,
        cohort_id: cohortId,
      },
    });
  }

  async updateProgress(userId: string, enrollmentId: string, progress: number) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId, user_id: userId },
    });

    if (!enrollment) {
      throw new NotFoundException(
        'Enrollment not found or does not belong to you',
      );
    }

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { progress_percent: progress },
    });
  }

  async updateStatus(
    adminId: string,
    enrollmentId: string,
    status: EnrollmentStatus,
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        cohort: {
          include: { program: true },
        },
      },
    });

    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const membership = await this.prisma.orgMember.findUnique({
      where: {
        org_id_user_id: {
          org_id: enrollment.cohort.program.org_id,
          user_id: adminId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have permission to modify enrollment status for this organization',
      );
    }

    return this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status },
    });
  }

  async getUserEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { user_id: userId },
      include: {
        cohort: {
          include: {
            program: {
              select: {
                title: true,
                cover_image: true,
                org: { select: { name: true } },
              },
            },
          },
        },
      },
    });
  }
}
