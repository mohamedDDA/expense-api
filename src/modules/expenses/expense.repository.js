// src/modules/expenses/expense.repository.js

import { Expense } from './expense.model.js';
import mongoose from 'mongoose';

export const expenseRepository = {
  // Every expense query is scoped to the owner -- there is no
  // "find all expenses" query anywhere in this repository. This
  // isn't an oversight; it's the ownership rule from Milestone 1
  // made structurally impossible to bypass by accident. A future
  // developer can't forget to scope by user, because there's no
  // unscoped method available to call.
  findAllByOwner: (ownerId) => Expense.find({ owner: ownerId }).populate('category'),

  findByIdAndOwner: (id, ownerId) => Expense.findOne({ _id: id, owner: ownerId }).populate('category'),

  create: (data) => Expense.create(data),

  updateByIdAndOwner: (id, ownerId, updates) =>
    Expense.findOneAndUpdate({ _id: id, owner: ownerId }, updates, {
      new: true,
      runValidators: true,
    }),

  deleteByIdAndOwner: (id, ownerId) => Expense.findOneAndDelete({ _id: id, owner: ownerId }),

  // Used only by category deletion (Milestone 9 follow-up): reassigns
  // every expense pointing at `fromCategoryId` to `toCategoryId`,
  // scoped to a single owner -- so deleting a shared default category
  // never touches other users' expenses. Not owner-unscoped: the
  // category being deleted always belongs to the requesting user
  // (defaults can't be deleted at all, per assertCanModify), so we
  // only ever need to move that one user's expenses.
  reassignCategoryForOwner: (ownerId, fromCategoryId, toCategoryId) =>
    Expense.updateMany(
      { owner: ownerId, category: fromCategoryId },
      { category: toCategoryId }
    ),

  countByCategoryForOwner: (ownerId, categoryId) =>
    Expense.countDocuments({ owner: ownerId, category: categoryId }),

  // WHY THIS IS AN AGGREGATION PIPELINE, NOT Expense.find() + JS reduce:
  // The alternative -- fetching every expense for this user into
  // Node and summing with .reduce() -- is the exact anti-pattern
  // from Milestone 8 (JS .filter() instead of a Mongo query), one
  // layer up: it pulls a potentially large dataset across the
  // network into application memory just to compute a handful of
  // numbers the database can produce directly. It also means every
  // client (browser tab, mobile app, second device) redoes the same
  // summation work from scratch, and -- worse -- would require
  // shipping every individual expense's amount/description/date
  // over the wire even when only the totals are ever displayed.
  //
  // $match narrows to this user's expenses in the given date range
  // BEFORE any grouping happens -- filtering first keeps the group
  // stage working with the smallest possible dataset.
  // $group sums amounts per category, entirely inside MongoDB.
  // $lookup + $unwind attach the category's name, so the API
  // doesn't need a second round-trip per category to label results.
getTotalsByCategory: (ownerId, { startDate, endDate } = {}) => {
  const match = {
    owner: new mongoose.Types.ObjectId(ownerId),
  };

  if (startDate || endDate) {
    match.date = {};

    if (startDate) {
      match.date.$gte = startDate;
    }

    if (endDate) {
      match.date.$lte = endDate;
    }
  }

  return Expense.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        expenseCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'categoryInfo',
      },
    },
    { $unwind: '$categoryInfo' },
    {
      $project: {
        _id: 0,
        categoryId: '$_id',
        categoryName: '$categoryInfo.name',
        totalAmount: 1,
        expenseCount: 1,
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);
},
};
