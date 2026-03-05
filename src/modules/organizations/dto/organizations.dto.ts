import { z } from 'zod';

export const CreateOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must be lowercase alphanumeric and hyphens only',
    ),
  logoUrl: z.string().url('Invalid URL format for logo').optional(),
  brandColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color')
    .optional(),
}).strict();

export type CreateOrganizationDto = z.infer<typeof CreateOrganizationSchema>;

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();
export type UpdateOrganizationDto = z.infer<typeof UpdateOrganizationSchema>;

export const AddMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'FACILITATOR']).default('FACILITATOR'),
}).strict();

export type AddMemberDto = z.infer<typeof AddMemberSchema>;
