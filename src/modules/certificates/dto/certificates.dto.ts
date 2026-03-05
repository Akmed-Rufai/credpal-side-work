import { z } from 'zod';

export const GenerateCertificateSchema = z.object({
  cohortId: z.string().uuid('Invalid cohort ID'),
});

export type GenerateCertificateDto = z.infer<typeof GenerateCertificateSchema>;
