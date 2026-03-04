import { z } from 'zod';

export const RegistrationSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    phone: z.string().optional(),
});

export type RegistrationDto = z.infer<typeof RegistrationSchema>;

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export type LoginDto = z.infer<typeof LoginSchema>;
