// src/modules/expenses/expense.service.js
//
// WHY THE categoryId CHECK EXISTS:
// Without it, a user could create an expense referencing a category
// ID that doesn't exist (silently corrupt data) OR belongs to
// another user entirely (an IDOR-style leak of which categories
// exist, and a nonsensical cross-user data reference). We reuse
// categoryService.assertVisibleToUser rather than re-deriving this
// logic here -- it's the exact same rule Category already enforces
// for its own read access.

import { expenseRepository } from './expense.repository.js';
import { categoryService } from '../categories/category.service.js';
import { AppError } from '../../utils/AppError.js';

export const expenseService = {
  getAllExpenses: (userId) => expenseRepository.findAllByOwner(userId),

  createExpense: async ({ amount, description, date, categoryId, userId }) => {
    // Throws (404) if the category doesn't exist or isn't visible
    // to this user -- see the note in category.service.js on why
    // this returns 404, not 403, for the "not yours" case.
    await categoryService.assertVisibleToUser(categoryId, userId);

    return expenseRepository.create({
      amount,
      description,
      date,
      category: categoryId,
      owner: userId,
    });
  },

  updateExpense: async ({ expenseId, updates, userId }) => {
    // If the update includes a new categoryId, it must be
    // re-validated the same way -- a user could otherwise "update"
    // an expense they own to point at a category they can't see.
    if (updates.categoryId) {
      await categoryService.assertVisibleToUser(updates.categoryId, userId);
      updates.category = updates.categoryId;
      delete updates.categoryId;
    }

    const expense = await expenseRepository.updateByIdAndOwner(expenseId, userId, updates);

    if (!expense) {
      throw new AppError('Expense not found', 404);
    }

    return expense;
  },

  deleteExpense: async ({ expenseId, userId }) => {
    const expense = await expenseRepository.deleteByIdAndOwner(expenseId, userId);

    if (!expense) {
      throw new AppError('Expense not found', 404);
    }
  },

  // WHY "current month" IS RESOLVED HERE, NOT IN THE CONTROLLER:
  // Deciding what "this month" means (today's date, first/last day
  // boundaries) is a business rule, not an HTTP concern -- the
  // controller shouldn't know or care how that's computed, only
  // that it can optionally forward explicit startDate/endDate query
  // params if the caller wants a different range.
  getCategoryTotals: ({ userId, startDate, endDate }) => {
    let resolvedStart = startDate;
    let resolvedEnd = endDate;

    if (!resolvedStart && !resolvedEnd) {
      const now = new Date();
      resolvedStart = new Date(now.getFullYear(), now.getMonth(), 1);
      // Day 0 of NEXT month is JS's idiomatic way to get the last
      // day of THIS month, regardless of how many days it has.
      resolvedEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    return expenseRepository.getTotalsByCategory(userId, {
      startDate: resolvedStart,
      endDate: resolvedEnd,
    });
  },
};
