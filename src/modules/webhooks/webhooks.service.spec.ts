import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../../database/prisma.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { TransactionStatus } from '@prisma/client';

describe('WebhooksService', () => {
    let service: WebhooksService;
    let prisma: PrismaService;
    let enrollmentsService: EnrollmentsService;

    const mockPrismaService = {
        $transaction: jest.fn(),
        transaction: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockEnrollmentsService = {
        enrollInCohort: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn().mockReturnValue('mocked-secret'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WebhooksService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: EnrollmentsService, useValue: mockEnrollmentsService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<WebhooksService>(WebhooksService);
        prisma = module.get<PrismaService>(PrismaService);
        enrollmentsService = module.get<EnrollmentsService>(EnrollmentsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('handlePaystackWebhook', () => {
        const rawBody = Buffer.from(JSON.stringify({
            event: 'charge.success',
            data: {
                reference: 'tx-123',
                metadata: { user_id: 'user-1', cohort_id: 'cohort-1' }
            }
        }));
        const payload = JSON.parse(rawBody.toString());
        const validSignature = crypto.createHmac('sha512', 'mocked-secret').update(rawBody).digest('hex');

        it('should throw BadRequestException on invalid signature', async () => {
            await expect(service.handlePaystackWebhook('invalid-sig', rawBody, payload)).rejects.toThrow(BadRequestException);
        });

        it('should ignore non charge.success events safely', async () => {
            const payloadObj = { event: 'charge.failed', data: { reference: 'tx-123' } };
            const nonSuccessBody = Buffer.from(JSON.stringify(payloadObj));
            const sig = crypto.createHmac('sha512', 'mocked-secret').update(nonSuccessBody).digest('hex');

            const result = await service.handlePaystackWebhook(sig, nonSuccessBody, payloadObj);
            expect(result).toEqual({ status: 'ignored' });
        });

        it('should handle charge.success via transaction update and enrollment', async () => {
            mockPrismaService.transaction.findUnique.mockResolvedValue({
                id: 'db-tx-1', reference: 'tx-123', status: TransactionStatus.PENDING
            });

            // Mock the Prisma $transaction functionality to immediately execute the callback executing sequentially inside
            mockPrismaService.$transaction.mockImplementation(async (callback) => {
                return callback(mockPrismaService);
            });

            const result = await service.handlePaystackWebhook(validSignature, rawBody, payload);

            // Verify the updates happened inside the $transaction callback flow mappings
            expect(mockPrismaService.transaction.update).toHaveBeenCalledWith({
                where: { reference: 'tx-123' },
                data: { status: TransactionStatus.SUCCESS },
            });
            // Verify enrollment was triggered
            expect(mockEnrollmentsService.enrollInCohort).toHaveBeenCalledWith('user-1', 'cohort-1');
            expect(result).toEqual({ status: 'success' });
        });
    });

});
