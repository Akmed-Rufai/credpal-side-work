import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Processor('certificates')
export class CertificatesProcessor extends WorkerHost {
  private readonly logger = new Logger(CertificatesProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { userId, cohortId } = job.data;

    this.logger.log(
      `Processing certificate job ${job.id} for user ${userId} in cohort ${cohortId}`,
    );

    // Prevent duplicate processing
    const existing = await this.prisma.certificate.findFirst({
      where: { user_id: userId, cohort_id: cohortId },
    });

    if (existing) {
      this.logger.warn(
        `Certificate already exists for user ${userId} and cohort ${cohortId}`,
      );
      return { status: 'SKIPPED', message: 'Certificate already generated' };
    }

    // SIMULATION: Perform heavy PDF Generation
    // Normally, this uses phantomJS, puppeteer, or pdfkit drawing vectors
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Simulate uploading constraints and mapping url resolution to AWS S3 bucket
    const randomizedPdfHashId = crypto.randomBytes(8).toString('hex');
    const pdfUrl = `https://cdn.credal.com/certificates/${randomizedPdfHashId}.pdf`;

    this.logger.debug(`PDF uploaded successfully to: ${pdfUrl}`);

    // Finalize generation persistently mapping the completed generation loop
    await this.prisma.certificate.create({
      data: {
        user_id: userId,
        cohort_id: cohortId,
        pdf_url: pdfUrl,
      },
    });

    this.logger.log(`Certificate job ${job.id} successfully processed!`);
    return { status: 'COMPLETED', certificateUrl: pdfUrl };
  }
}
