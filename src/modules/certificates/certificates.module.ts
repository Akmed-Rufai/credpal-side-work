import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { CertificatesController } from './certificates.controller';
import { CertificatesService } from './certificates.service';
import { CertificatesProcessor } from './certificates.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'certificates',
    }),
  ],
  controllers: [CertificatesController],
  providers: [CertificatesService, CertificatesProcessor],
  exports: [CertificatesService],
})
export class CertificatesModule {}
