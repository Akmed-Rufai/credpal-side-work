import { z } from 'zod';

export const UpdateProgressSchema = z.object({
  progress: z
    .number()
    .min(0, 'Progress cannot be less than 0')
    .max(100, 'Progress cannot be more than 100'),
});

export type UpdateProgressDto = z.infer<typeof UpdateProgressSchema>;

export const UpdateEnrollmentStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'COMPLETED', 'DROPPED']),
});

export type UpdateEnrollmentStatusDto = z.infer<
  typeof UpdateEnrollmentStatusSchema
>;
