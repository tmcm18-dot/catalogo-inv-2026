import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(254),
  password: z.string().min(1).max(256),
  rememberMe: z.boolean().default(false),
});

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().min(8).max(32),
    password: z.string().min(10).max(128),
    confirmPassword: z.string().min(10).max(128),
    acceptTerms: z.literal(true),
    acceptPrivacy: z.literal(true),
    marketingConsent: z.boolean().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export const verifyEmailSchema = z.object({
  token: z.string().min(10).max(512),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(3).max(254),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10).max(512),
    password: z.string().min(10).max(128),
    confirmPassword: z.string().min(10).max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export const twoFactorCodeSchema = z.object({
  code: z.string().trim().min(6).max(32),
});

export const twoFactorSetupConfirmSchema = z.object({
  code: z.string().trim().min(6).max(12),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
