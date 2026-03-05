import { Test, TestingModule } from '@nestjs/testing';
import { CertificatesService } from './certificates.service';
import { PrismaService } from '../../database/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EnrollmentStatus } from '@prisma/client';

describe('CertificatesService', () => {
  let service: CertificatesService;
  let prisma: PrismaService;

  const mockQueue = {
    add: jest.fn(),
  };

  const mockPrismaService = {
    enrollment: {
      findUnique: jest.fn(),
    },
    certificate: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: getQueueToken('certificates'), useValue: mockQueue },
      ],
    }).compile();

    service = module.get<CertificatesService>(CertificatesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestCertificate', () => {
    const userId = 'user-1';
    const cohortId = 'cohort-1';

    it('should throw NotFoundException if user is not enrolled in cohort', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.requestCertificate(userId, cohortId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if enrollment is not complete', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        status: EnrollmentStatus.ACTIVE,
      });

      await expect(
        service.requestCertificate(userId, cohortId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should return existing certificate if already generated', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        status: EnrollmentStatus.COMPLETED,
      });

      const existingCert = {
        id: 'cert-1',
        pdf_url: 'https://cdn.example.com/cert-1.pdf',
      };
      mockPrismaService.certificate.findFirst.mockResolvedValue(existingCert);

      const result = await service.requestCertificate(userId, cohortId);
      expect(result).toEqual({ status: 'READY', certificate: existingCert });
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should enqueue job if certificate does not exist', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        status: EnrollmentStatus.COMPLETED,
        user: { name: 'John Doe', email: 'john@example.com' },
        cohort: {
          program: { title: 'NestJS Masterclass' },
          org: { name: 'Acme Corp' },
        },
      });
      mockPrismaService.certificate.findFirst.mockResolvedValue(null);

      const result = await service.requestCertificate(userId, cohortId);

      expect(mockQueue.add).toHaveBeenCalledWith('generate-pdf', {
        userId,
        cohortId,
      });
      expect(result).toEqual({
        status: 'PROCESSING',
        message: 'Certificate generation queued.',
      });
    });
  });
});
