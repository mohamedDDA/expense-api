// src/modules/categories/category.validation.js

import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(50, 'Category name is too long'),
});

// Update uses the same shape as create here -- name is currently
// the only editable field. If Category grows more fields later,
// this would likely diverge from createCategorySchema (e.g. an
// update schema might make every field optional). Keeping them
// separate now, even though identical, means that future change
// doesn't require restructuring anything -- just editing this one
// schema.
export const updateCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(50, 'Category name is too long'),
});
