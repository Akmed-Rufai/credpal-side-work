import { Test, TestingModule } from '@nestjs/testing';
import { ProgramsService } from './programs.service';
import { PrismaService } from '../../database/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ProgramsService', () => {
  let service: ProgramsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    orgMember: {
      findUnique: jest.fn(),
    },
    program: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    cohort: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    session: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgramsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProgramsService>(ProgramsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProgram', () => {
    const orgId = 'org-1';
    const userId = 'user-1';
    const dto = { title: 'Test Program', price: 10000, currency: 'NGN' };

    it('should throw ForbiddenException if user is not a member of the organization', async () => {
      mockPrismaService.orgMember.findUnique.mockResolvedValue(null);

      await expect(service.createProgram(userId, orgId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should create a program if user is a valid member', async () => {
      mockPrismaService.orgMember.findUnique.mockResolvedValue({
        role: 'ADMIN',
      });
      const expectedOutput = {
        id: 'prog-1',
        org_id: orgId,
        ...dto,
        status: 'DRAFT',
      };
      mockPrismaService.program.create.mockResolvedValue(expectedOutput);

      const result = await service.createProgram(userId, orgId, dto);

      expect(prisma.program.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          org_id: orgId,
          title: dto.title,
          price: dto.price,
          currency: dto.currency,
          status: 'DRAFT',
        }),
      });
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('createCohort', () => {
    const userId = 'user-1';
    const programId = 'prog-1';
    const orgId = 'org-1';
    const dto = {
      name: 'Cohort 1',
      startDate: '2023-10-01T00:00:00Z',
      endDate: '2023-12-01T00:00:00Z',
    };

    it('should throw NotFoundException if program does not exist', async () => {
      mockPrismaService.program.findUnique.mockResolvedValue(null);

      await expect(
        service.createCohort(userId, programId, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not part of the org owning the program', async () => {
      mockPrismaService.program.findUnique.mockResolvedValue({
        id: programId,
        org_id: orgId,
      });
      mockPrismaService.orgMember.findUnique.mockResolvedValue(null);

      await expect(
        service.createCohort(userId, programId, dto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should create a cohort on valid access', async () => {
      mockPrismaService.program.findUnique.mockResolvedValue({
        id: programId,
        org_id: orgId,
      });
      mockPrismaService.orgMember.findUnique.mockResolvedValue({
        role: 'ADMIN',
      });

      const expectedCohort = {
        id: 'coh-1',
        program_id: programId,
        name: dto.name,
      };
      mockPrismaService.cohort.create.mockResolvedValue(expectedCohort);

      const result = await service.createCohort(userId, programId, dto);

      expect(prisma.cohort.create).toHaveBeenCalledWith({
        data: {
          program_id: programId,
          name: dto.name,
          start_date: new Date(dto.startDate),
          end_date: new Date(dto.endDate),
        },
      });
      expect(result).toEqual(expectedCohort);
    });
  });
});
