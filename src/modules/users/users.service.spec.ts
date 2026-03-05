import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../database/prisma.service';
import { User } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    profile: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockUser: User = {
    id: 'u-1',
    email: 'test@example.com',
    password_hash: 'hashedpass',
    role: 'USER',
    is_verified: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return a user if found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findByEmail('test@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('createProfile', () => {
    it('should create a profile linking to a user', async () => {
      const mockProfileData = { first_name: 'John', last_name: 'Doe' };
      const expectedOutput = { id: 'p-1', user_id: 'u-1', ...mockProfileData };

      mockPrismaService.profile.create.mockResolvedValue(expectedOutput);

      const result = await service.createProfile('u-1', mockProfileData);

      expect(prisma.profile.create).toHaveBeenCalledWith({
        data: {
          ...mockProfileData,
          user: { connect: { id: 'u-1' } },
        },
      });
      expect(result).toEqual(expectedOutput);
    });
  });
});
