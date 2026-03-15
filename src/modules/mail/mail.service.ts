import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MailService {

  constructor(
  @InjectQueue('mail') private mailQueue: Queue) {}

  async sendWelcomeEmail(email: string, verificationLink: string) {

    await this.mailQueue.add('welcome-email', {
      email,
      verificationLink
    });

  }

  async forgetPasswordEmail(email: string, resetLink: string) {

    await this.mailQueue.add('forgot-mail', {
      email,
      resetLink
    });

  }

}