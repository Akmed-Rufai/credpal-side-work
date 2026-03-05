import { z } from 'zod';

export const CreateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
}).strict();

export type CreateProfileDto = z.infer<typeof CreateProfileSchema>;
