import {
  Controller,
  Post,
  Body,
  UseGuards,
  UsePipes,
  HttpCode,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  InitializePaymentSchema,
  type InitializePaymentDto,
} from './dto/payments.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  @Post('initialize')
  @HttpCode(200)
  @UsePipes(new ZodValidationPipe(InitializePaymentSchema))
  initializePayment(
    @CurrentUser() user: { id: string },
    @Body() dto: InitializePaymentDto,
  ) {
    return this.paymentsService.initializePayment(user.id, dto.cohortId);
  }
}
