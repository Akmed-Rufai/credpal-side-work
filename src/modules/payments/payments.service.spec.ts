import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    cohort: {
      findUnique: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('sk_test_mock'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initializePayment', () => {
    const userId = 'user-1';
    const cohortId = 'cohort-1';

    it('should throw NotFoundException if cohort or program is invalid', async () => {
      mockPrismaService.cohort.findUnique.mockResolvedValue(null);

      await expect(service.initializePayment(userId, cohortId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create a pending transaction and return fake checkout url', async () => {
      mockPrismaService.cohort.findUnique.mockResolvedValue({
        id: cohortId,
        program: { price: 50000, currency: 'NGN' },
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'payer@test.com',
      });

      const expectedTx = {
        id: 'tx-123',
        user_id: userId,
        reference: 'random-ref',
        amount: 50000,
        currency: 'NGN',
        status: TransactionStatus.PENDING,
      };

      mockPrismaService.transaction.create.mockResolvedValue(expectedTx);

      // We mock global fetch just for the Paystack request
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: true,
          data: { authorization_url: 'https://checkout.paystack.com/fake' },
        }),
      });

      const result = await service.initializePayment(userId, cohortId);

      expect(prisma.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user_id: userId,
            amount: 50000,
            currency: 'NGN',
            status: TransactionStatus.PENDING,
          }),
        }),
      );

      expect(result).toHaveProperty(
        'authorization_url',
        'https://checkout.paystack.com/fake',
      );
      expect(result).toHaveProperty('reference');
    });
  });
});
