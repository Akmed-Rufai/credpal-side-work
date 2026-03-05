import {
  Controller,
  Post,
  Body,
  UseGuards,
  UsePipes,
  HttpCode,
} from '@nestjs/common';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { GenerateCertificateSchema } from './dto/certificates.dto';
import type { GenerateCertificateDto } from './dto/certificates.dto';

@Controller('certificates')
@UseGuards(JwtAuthGuard)
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post('request')
  @HttpCode(202)
  @UsePipes(new ZodValidationPipe(GenerateCertificateSchema))
  requestCertificate(
    @CurrentUser() user: { id: string },
    @Body() dto: GenerateCertificateDto,
  ) {
    return this.certificatesService.requestCertificate(user.id, dto.cohortId);
  }
}
