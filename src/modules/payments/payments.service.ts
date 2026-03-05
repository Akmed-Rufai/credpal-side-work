import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { TransactionStatus } from '@prisma/client';
import { randomBytes } from 'crypto';

@Injectable()
export class PaymentsService {
    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) { }

    async initializePayment(userId: string, cohortId: string) {
        // 1. Fetch cohort and program pricing
        const cohort = await this.prisma.cohort.findUnique({
            where: { id: cohortId },
            include: { program: true },
        });
        if (!cohort || !cohort.program) {
            throw new NotFoundException('Cohort or associated program not found');
        }

        const { price, currency } = cohort.program;
        if (price <= 0) {
            throw new BadRequestException('Cannot initialize payment for a free course');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) throw new NotFoundException('User not found');

        // 2. Generate Reference & PENDING Transaction
        const reference = `TX-${randomBytes(8).toString('hex').toUpperCase()}`;
        const transaction = await this.prisma.transaction.create({
            data: {
                user_id: userId,
                reference,
                amount: price,
                currency: currency,
                status: TransactionStatus.PENDING,
                // Optional: Save cohortId conceptually or stringify it in gateway_response for the webhook lookup later
                gateway_response: JSON.stringify({ cohort_id: cohortId }),
            },
        });

        // 3. Initiate Paystack call
        const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');

        try {
            const response = await fetch('https://api.paystack.co/transaction/initialize', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: user.email,
                    amount: price, // already in kobo for NGN
                    reference: reference,
                    currency: currency,
                    // Custom fields so Paystack sends it back via webhook
                    metadata: {
                        user_id: userId,
                        cohort_id: cohortId,
                    },
                }),
            });

            const data = await response.json();
            if (!data.status) {
                throw new BadRequestException(data.message || 'Payment initialization failed');
            }

            return {
                authorization_url: data.data.authorization_url,
                access_code: data.data.access_code,
                reference: data.data.reference,
            };

        } catch (error) {
            console.error('Paystack initialization error', error);
            throw new InternalServerErrorException('Payment gateway unavailable');
        }
    }
}