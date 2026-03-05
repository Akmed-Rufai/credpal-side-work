import { z } from 'zod';

export const InitializePaymentSchema = z.object({
  cohortId: z.string().uuid('Invalid cohort ID'),
});

export type InitializePaymentDto = z.infer<typeof InitializePaymentSchema>;
