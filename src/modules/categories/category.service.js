// src/modules/categories/category.service.js
//
// WHY THIS FILE EXISTS:
// This is where the ownership rule from Milestone 1 actually gets
// enforced: a user may only update/delete a category they own --
// never a default category, and never another user's category.
//
// This check is deliberately centralized in ONE function
// (assertCanModify) rather than repeated inline inside update() and
// delete() separately -- so the rule is defined exactly once and
// can't drift out of sync between the two operations.

import { categoryRepository } from './category.repository.js';
import { expenseRepository } from '../expenses/expense.repository.js';
import { AppError } from '../../utils/AppError.js';
import { FALLBACK_CATEGORY_NAME } from '../../config/seed.js';

// WHY category.service.js IMPORTS FROM modules/expenses/:
// This is a deliberate, narrow exception to "modules shouldn't
// import each other's internals" (Milestone 2). We're not importing
// expense.service.js (business logic) or expense.model.js (schema
// internals) -- only expenseRepository, a thin, already-scoped-by-
// owner data-access surface. The alternative -- moving this
// reassignment logic INTO expense.service.js and having
// category.service.js call THAT -- just moves the coupling to the
// other module without removing it; deletion is fundamentally a
// Category operation with a side effect on Expense records, so it
// belongs here. Logged in DECISIONS.md as an accepted, bounded
// exception rather than left as an unexamined dependency.

const assertCanModify = (category, userId) => {
  if (category.owner === null) {
    throw new AppError('Default categories cannot be modified', 403);
  }

  // category.owner is an ObjectId; userId here is the string from
  // req.user.id. .equals() handles the type comparison correctly --
  // a plain === would incorrectly return false even for the same ID,
  // since ObjectId and string are different JS types.
  if (!category.owner.equals(userId)) {
    throw new AppError('You do not have permission to modify this category', 403);
  }
};

export const categoryService = {
  getVisibleCategories: (userId) => categoryRepository.findVisibleToUser(userId),

  // Reusable across modules: given a categoryId, confirms it exists
  // AND is visible to this user (default OR owned by them), then
  // returns it. Used by expense.service.js so a user can't create
  // an expense referencing a category they can't see -- see
  // Milestone 9 for why this check exists.
  //
  // Note this is a DIFFERENT rule than assertCanModify above:
  // visibility (can you SEE/USE it) is broader than modify
  // permission (can you EDIT/DELETE it) -- every user can see
  // default categories, but nobody can modify them.
  assertVisibleToUser: async (categoryId, userId) => {
    const category = await categoryRepository.findById(categoryId);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const isDefault = category.owner === null;
    const isOwnedByUser = category.owner && category.owner.equals(userId);

    if (!isDefault && !isOwnedByUser) {
      throw new AppError('Category not found', 404);
      // Deliberately 404, not 403: revealing "this category exists
      // but isn't yours" (403) would confirm the ID is valid,
      // leaking information about data that isn't visible to this
      // user. 404 ("not found") is indistinguishable from a truly
      // nonexistent ID -- consistent with the user-enumeration
      // reasoning from Milestone 6's login logic.
    }

    return category;
  },

  createCategory: ({ name, userId }) => {
    // Every category created through this endpoint is owned by the
    // requesting user -- there is no way for a regular user to
    // create a default (owner: null) category through this API.
    return categoryRepository.create({ name, owner: userId });
  },

  updateCategory: async ({ categoryId, name, userId }) => {
    const category = await categoryRepository.findById(categoryId);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    assertCanModify(category, userId);

    return categoryRepository.updateById(categoryId, { name });
  },

  deleteCategory: async ({ categoryId, userId }) => {
    const category = await categoryRepository.findById(categoryId);

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    assertCanModify(category, userId);
    // Reaching here guarantees category.owner equals userId --
    // assertCanModify already rejected default categories and
    // other users' categories. Safe to proceed with reassignment
    // scoped to this single user.

    const fallback = await categoryRepository.findDefaultByName(FALLBACK_CATEGORY_NAME);

    if (!fallback) {
      // Should be impossible in normal operation -- seedDefaultCategories
      // runs at every server startup, before traffic is accepted
      // (see server.js). Treated as a 500, not a 404/403: this is
      // an infrastructure failure, not something the requesting
      // user did wrong.
      throw new AppError('Fallback category is not configured', 500);
    }

    // A user can never delete the fallback category itself --
    // assertCanModify already guarantees this, since fallback.owner
    // is null and category.owner must equal userId to reach this
    // point. Asserting it explicitly here would be redundant; noted
    // for clarity, not enforced twice.

    const { modifiedCount } = await expenseRepository.reassignCategoryForOwner(
      userId,
      categoryId,
      fallback._id
    );

    await categoryRepository.deleteById(categoryId);

    return { reassignedExpenseCount: modifiedCount };
  },
};
