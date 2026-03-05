import { Test, TestingModule } from '@nestjs/testing';
import { CertificatesProcessor } from './certificates.processor';
import { PrismaService } from '../../database/prisma.service';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

describe('CertificatesProcessor', () => {
  let processor: CertificatesProcessor;
  let prisma: PrismaService;

  const mockPrismaService = {
    certificate: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificatesProcessor,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    processor = module.get<CertificatesProcessor>(CertificatesProcessor);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('process', () => {
    it('should generate a certificate and save to database', async () => {
      // Prevent random collisions by returning null
      mockPrismaService.certificate.findFirst.mockResolvedValue(null);

      const expectedCert = {
        id: 'cert-123',
        user_id: 'user-1',
        cohort_id: 'cohort-1',
        pdf_url: 'https://cdn.example.com/certificates/tx-mock.pdf',
        issue_date: new Date(),
      };

      mockPrismaService.certificate.create.mockResolvedValue(expectedCert);

      const mockJob = {
        name: 'generate-pdf',
        data: { userId: 'user-1', cohortId: 'cohort-1' },
        id: 'job-1',
      } as unknown as Job;

      const result = await processor.process(mockJob);

      expect(prisma.certificate.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          user_id: 'user-1',
          cohort_id: 'cohort-1',
          pdf_url: expect.stringContaining(
            'https://cdn.credal.com/certificates/',
          ),
        }),
      });

      expect(result).toEqual({
        status: 'COMPLETED',
        certificateUrl: expect.any(String),
      });
    });

    it('should skip generation if it already exists to prevent duplicate job processing bugs', async () => {
      const existingCert = {
        id: 'cert-123',
        user_id: 'user-1',
        cohort_id: 'cohort-1',
        pdf_url: 'https://cdn.example.com/certificates/mock.pdf',
        issue_date: new Date(),
      };

      mockPrismaService.certificate.findFirst.mockResolvedValue(existingCert);

      const mockJob = {
        name: 'generate-pdf',
        data: { userId: 'user-1', cohortId: 'cohort-1' },
        id: 'job-1',
      } as unknown as Job;

      const result = await processor.process(mockJob);

      expect(prisma.certificate.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        status: 'SKIPPED',
        message: 'Certificate already generated',
      });
    });
  });
});
