// src/modules/expenses/expense.validation.js

import { z } from 'zod';

// A MongoDB ObjectId is always exactly 24 hex characters. Validating
// this shape here means a malformed categoryId (e.g. "abc" or an
// empty string) is rejected with a clear 400 message BEFORE it ever
// reaches Mongoose -- which would otherwise throw a much less
// friendly CastError deep inside a query.
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid category ID');

export const createExpenseSchema = z.object({
  amount: z.number().positive('Amount must be greater than zero'),
  description: z.string().trim().min(1, 'Description is required').max(200, 'Description is too long'),
  date: z.coerce.date('Must be a valid date'),
  categoryId: objectIdSchema,
});

// All fields optional for update -- a client should be able to
// change just the amount without resending everything else. Zod's
// .partial() derives this automatically from createExpenseSchema
// rather than us re-typing every field with .optional() by hand.
export const updateExpenseSchema = createExpenseSchema.partial();
