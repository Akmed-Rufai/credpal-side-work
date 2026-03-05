import {
  Controller,
  Post,
  Headers,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { PaystackWebhookDto } from './dto/webhooks.dto';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('paystack')
  async handlePaystackWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: any,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing signature');
    }

    // Since NestJS body parser is enabled, req.body is already JSON parsed.
    // To validate HMAC accurately, we need the raw buffer.
    // A quick hack when rawBody is stringified from parsed bodies:
    const rawBodyBuffer = Buffer.from(JSON.stringify(req.body));
    const payload = req.body as PaystackWebhookDto;

    return this.webhooksService.handlePaystackWebhook(
      signature,
      rawBodyBuffer,
      payload,
    );
  }
}
