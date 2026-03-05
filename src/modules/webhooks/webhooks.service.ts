import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { TransactionStatus } from '@prisma/client';
import { PaystackWebhookDto } from './dto/webhooks.dto';

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private enrollmentsService: EnrollmentsService,
    private configService: ConfigService,
  ) {}

  async handlePaystackWebhook(
    signature: string,
    rawBody: Buffer,
    payload: PaystackWebhookDto,
  ) {
    const secret = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not defined');

    // 1. Validate HMAC signature
    const hash = crypto
      .createHmac('sha512', secret)
      .update(rawBody)
      .digest('hex');
    if (hash !== signature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // 2. Only process charge.success events
    if (payload.event !== 'charge.success') {
      return { status: 'ignored' };
    }

    const { reference, metadata } = payload.data;
    if (!reference || !metadata?.user_id || !metadata?.cohort_id) {
      console.warn(
        'Webhook received without necessary tracking metadata for reference:',
        reference,
      );
      return { status: 'ignored_missing_data' };
    }

    const userId = metadata.user_id;
    const cohortId = metadata.cohort_id;

    // 3. Atomically update transaction and enroll the user
    await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { reference },
      });

      if (!transaction || transaction.status === TransactionStatus.SUCCESS) {
        // Prevent double-processing
        return;
      }

      await tx.transaction.update({
        where: { reference },
        data: { status: TransactionStatus.SUCCESS },
      });

      // Call the enrollments service securely internally, bypassing controller guards
      await this.enrollmentsService.enrollInCohort(userId, cohortId);
    });

    return { status: 'success' };
  }
}
