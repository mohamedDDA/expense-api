// src/config/seed.js
//
// WHY THIS FILE EXISTS:
// Default categories (Food, Transport, Others, etc.) are shared
// data every user should see without creating them individually.
// The only reliable way to guarantee they exist in EVERY
// environment (a teammate's fresh clone, CI, staging, production)
// is to create them programmatically at startup -- not by manually
// inserting them once via a DB client, which only "works" on
// whichever single database you happened to run that command
// against. This file is that guarantee.
//
// "Others" specifically also serves a second purpose: it's the
// reassignment target when a user deletes a category that still has
// expenses referencing it (Milestone 9 follow-up). It requires no
// special shape or field to do this -- it's seeded identically to
// every other default category below. FALLBACK_CATEGORY_NAME just
// marks WHICH seeded category plays that role.
//
// IDEMPOTENT BY DESIGN: safe to run on every single boot. Each
// category is checked for existence individually, so restarting
// the server never creates duplicates.

import { Category } from '../modules/categories/category.model.js';
import { logger } from './logger.js';

export const FALLBACK_CATEGORY_NAME = 'Others';

const DEFAULT_CATEGORY_NAMES = ['Food', 'Transport', 'Utilities', 'Entertainment', FALLBACK_CATEGORY_NAME];

export const seedDefaultCategories = async () => {
  for (const name of DEFAULT_CATEGORY_NAMES) {
    const existing = await Category.findOne({ name, owner: null });

    if (existing) continue;

    await Category.create({ name, owner: null });
    logger.info('Seeded default category', { name });
  }
};

