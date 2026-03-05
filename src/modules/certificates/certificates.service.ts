import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EnrollmentStatus } from '@prisma/client';

@Injectable()
export class CertificatesService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('certificates') private certificatesQueue: Queue,
  ) {}

  async requestCertificate(userId: string, cohortId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        user_id_cohort_id: {
          user_id: userId,
          cohort_id: cohortId,
        },
      },
      include: {
        user: true,
        cohort: {
          include: {
            program: { include: { org: true } },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.status !== EnrollmentStatus.COMPLETED) {
      throw new BadRequestException(
        'Not eligible for a certificate. Enrollment must be strictly COMPLETED.',
      );
    }

    const existingCert = await this.prisma.certificate.findFirst({
      where: {
        user_id: userId,
        cohort_id: cohortId,
      },
    });

    if (existingCert) {
      return { status: 'READY', certificate: existingCert };
    }

    // Hand off intensive PDF generator processes to a background job Worker
    await this.certificatesQueue.add('generate-pdf', {
      userId,
      cohortId,
    });

    return { status: 'PROCESSING', message: 'Certificate generation queued.' };
  }
}
