import { z } from 'zod';

export const PaystackWebhookSchema = z
  .object({
    event: z.string(),
    data: z
      .object({
        reference: z.string(),
        metadata: z
          .object({
            user_id: z.string().optional(),
            cohort_id: z.string().optional(),
          })
          .optional(),
      })
      .passthrough(),
  })
  .passthrough();

export type PaystackWebhookDto = z.infer<typeof PaystackWebhookSchema>;
