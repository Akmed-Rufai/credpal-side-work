import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../../database/prisma.service';
import { OrgRole } from '@prisma/client';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    organization: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    orgMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrganization', () => {
    it('should throw ConflictException if slug is already taken', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: 'org-1',
      });

      await expect(
        service.createOrganization('user-1', {
          name: 'Test Org',
          slug: 'test-org',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create an organization and assign owner as ADMIN within transaction', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      const newOrg = {
        id: 'org-new',
        name: 'Test Org',
        slug: 'test-org',
        owner_id: 'user-1',
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        mockPrismaService.organization.create.mockResolvedValue(newOrg);
        mockPrismaService.orgMember.create.mockResolvedValue({});
        return await callback(mockPrismaService);
      });

      const result = await service.createOrganization('user-1', {
        name: 'Test Org',
        slug: 'test-org',
      });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'test-org',
            owner_id: 'user-1',
          }),
        }),
      );
      expect(prisma.orgMember.create).toHaveBeenCalledWith({
        data: { org_id: 'org-new', user_id: 'user-1', role: OrgRole.ADMIN },
      });
      expect(result).toEqual(newOrg);
    });
  });

  describe('addMember', () => {
    const adminId = 'admin-1';
    const targetUserId = 'target-1';
    const orgId = 'org-1';

    it('should throw ForbiddenException if requester is not an ADMIN', async () => {
      mockPrismaService.orgMember.findUnique.mockResolvedValue(null);

      await expect(
        service.addMember(orgId, adminId, {
          email: 'test@test.com',
          role: 'FACILITATOR',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if user email does not exist', async () => {
      mockPrismaService.orgMember.findUnique.mockResolvedValue({
        org_id: orgId,
        user_id: adminId,
        role: OrgRole.ADMIN,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.addMember(orgId, adminId, {
          email: 'no@host.com',
          role: 'FACILITATOR',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should add a member successfully', async () => {
      mockPrismaService.orgMember.findUnique
        .mockResolvedValueOnce({
          org_id: orgId,
          user_id: adminId,
          role: OrgRole.ADMIN,
        }) // Admin check
        .mockResolvedValueOnce(null); // Existing member check

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: targetUserId,
        email: 'user@host.com',
      });
      mockPrismaService.orgMember.create.mockResolvedValue({
        org_id: orgId,
        user_id: targetUserId,
        role: OrgRole.FACILITATOR,
      });

      const result = await service.addMember(orgId, adminId, {
        email: 'user@host.com',
        role: 'FACILITATOR',
      });

      expect(prisma.orgMember.create).toHaveBeenCalledWith({
        data: {
          org_id: orgId,
          user_id: targetUserId,
          role: OrgRole.FACILITATOR,
        },
      });
      expect(result.user_id).toBe(targetUserId);
    });
  });

  describe('removeMember', () => {
    it('should throw ForbiddenException if removing the owner', async () => {
      const orgId = 'org-1';
      const adminId = 'admin-1';

      mockPrismaService.orgMember.findUnique.mockResolvedValue({
        org_id: orgId,
        user_id: adminId,
        role: OrgRole.ADMIN,
      });
      mockPrismaService.organization.findUnique.mockResolvedValue({
        id: orgId,
        owner_id: 'owner-1',
      });

      await expect(
        service.removeMember(orgId, adminId, 'owner-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
