import { Test, TestingModule } from '@nestjs/testing';
import { EnrollmentsService } from './enrollments.service';
import { PrismaService } from '../../database/prisma.service';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, OrgRole } from '@prisma/client';

describe('EnrollmentsService', () => {
  let service: EnrollmentsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    cohort: {
      findUnique: jest.fn(),
    },
    enrollment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    orgMember: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EnrollmentsService>(EnrollmentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('enrollInCohort', () => {
    const userId = 'user-1';
    const cohortId = 'cohort-1';

    it('should throw NotFoundException if cohort does not exist', async () => {
      mockPrismaService.cohort.findUnique.mockResolvedValue(null);

      await expect(service.enrollInCohort(userId, cohortId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if already enrolled', async () => {
      mockPrismaService.cohort.findUnique.mockResolvedValue({ id: cohortId });
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        id: 'enr-1',
      });

      await expect(service.enrollInCohort(userId, cohortId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should enroll user and return new enrollment record', async () => {
      mockPrismaService.cohort.findUnique.mockResolvedValue({ id: cohortId });
      mockPrismaService.enrollment.findUnique.mockResolvedValue(null);

      const expectedRecord = {
        id: 'enr-1',
        user_id: userId,
        cohort_id: cohortId,
        status: EnrollmentStatus.ACTIVE,
        progress_percent: 0,
      };
      mockPrismaService.enrollment.create.mockResolvedValue(expectedRecord);

      const result = await service.enrollInCohort(userId, cohortId);

      expect(prisma.enrollment.create).toHaveBeenCalledWith({
        data: {
          user_id: userId,
          cohort_id: cohortId,
        },
      });
      expect(result).toEqual(expectedRecord);
    });
  });

  describe('updateProgress', () => {
    const userId = 'user-1';
    const enrollmentId = 'enr-1';
    const newProgress = 50;

    it('should throw NotFoundException if enrollment invalid or doesnt belong to user', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue(null);

      await expect(
        service.updateProgress(userId, enrollmentId, newProgress),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update and return enrollment progress', async () => {
      mockPrismaService.enrollment.findFirst.mockResolvedValue({
        id: enrollmentId,
        user_id: userId,
        progress_percent: 0,
      });
      mockPrismaService.enrollment.update.mockResolvedValue({
        id: enrollmentId,
        progress_percent: newProgress,
      });

      const result = await service.updateProgress(
        userId,
        enrollmentId,
        newProgress,
      );

      expect(prisma.enrollment.update).toHaveBeenCalledWith({
        where: { id: enrollmentId },
        data: { progress_percent: newProgress },
      });
      expect(result.progress_percent).toEqual(newProgress);
    });
  });

  describe('updateStatus', () => {
    const adminId = 'admin-1';
    const enrollmentId = 'enr-1';
    const newStatus = EnrollmentStatus.DROPPED;

    it('should throw NotFoundException if enrollment does not exist', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus(adminId, enrollmentId, newStatus),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if requester is not an org facilitator/admin', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        id: enrollmentId,
        cohort: { program: { org_id: 'org-1' } },
      });
      mockPrismaService.orgMember.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus(adminId, enrollmentId, newStatus),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update status when authorized', async () => {
      mockPrismaService.enrollment.findUnique.mockResolvedValue({
        id: enrollmentId,
        cohort: { program: { org_id: 'org-1' } },
      });
      mockPrismaService.orgMember.findUnique.mockResolvedValue({
        role: OrgRole.FACILITATOR,
      });
      mockPrismaService.enrollment.update.mockResolvedValue({
        id: enrollmentId,
        status: newStatus,
      });

      const result = await service.updateStatus(
        adminId,
        enrollmentId,
        newStatus,
      );

      expect(prisma.enrollment.update).toHaveBeenCalledWith({
        where: { id: enrollmentId },
        data: { status: newStatus },
      });
      expect(result.status).toEqual(newStatus);
    });
  });
});
