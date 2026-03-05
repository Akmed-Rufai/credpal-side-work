import { z } from 'zod';

export const CreateProgramSchema = z.object({
    title: z.string().min(1, 'Program title is required'),
    description: z.string().optional(),
    price: z.number().int().min(0, 'Price must be a positive integer in kobo/cents'),
    currency: z.string().length(3).default('NGN'),
    coverImage: z.string().url().optional(),
});

export type CreateProgramDto = z.infer<typeof CreateProgramSchema>;

export const UpdateProgramSchema = CreateProgramSchema.partial().extend({
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
});
export type UpdateProgramDto = z.infer<typeof UpdateProgramSchema>;

export const CreateCohortSchema = z.object({
    name: z.string().min(1, 'Cohort name is required'),
    startDate: z.string().datetime('Invalid start date'),
    endDate: z.string().datetime('Invalid end date'),
});

export type CreateCohortDto = z.infer<typeof CreateCohortSchema>;

export const CreateSessionSchema = z.object({
    title: z.string().min(1, 'Session title is required'),
    startTime: z.string().datetime('Invalid start time'),
    endTime: z.string().datetime('Invalid end time'),
    meetingLink: z.string().url().optional(),
});

export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;
