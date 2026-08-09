// src/modules/auth/auth.validation.js
//
// WHY THIS FILE EXISTS:
// Defines the exact shape a register/login request body must have.
// Kept in the auth module (not middleware/) because these schemas
// are OWNED by this module -- unlike validate.js itself, nothing
// else in the app needs to know what a valid login payload looks
// like.

import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().toLowerCase().email('Must be a valid email'),
  // Matches bcrypt's own practical limit and gives users a clear,
  // upfront reason if their password is too short -- rather than
  // letting a weak password through and failing silently on
  // security grounds later.
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Must be a valid email'),
  password: z.string().min(1, 'Password is required'),
});
