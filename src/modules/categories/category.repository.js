// src/modules/categories/category.repository.js
//
// WHY THIS FILE EXISTS:
// Isolates the actual MongoDB query shape (including the $or logic
// for "default OR owned by this user") from the service layer,
// which only needs to know WHAT it wants, not HOW Mongo expresses it.

import { Category } from './category.model.js';

export const categoryRepository = {
  // Returns every category a given user is allowed to see:
  // global defaults (owner: null) plus their own (owner: userId).
  // Filtering happens INSIDE MongoDB via the query itself -- not by
  // loading all categories into memory and filtering in JS.
  findVisibleToUser: (userId) =>
    Category.find({
      $or: [{ owner: null }, { owner: userId }],
    }),

  findById: (id) => Category.findById(id),

  // Used to locate the seeded default fallback category (e.g.
  // "Others") by name when reassigning orphaned expenses during a
  // category delete. Only ever matches default (owner: null)
  // categories -- a user-created category with the same name should
  // never be mistaken for the system fallback.
  findDefaultByName: (name) => Category.findOne({ name, owner: null }),

  create: (data) => Category.create(data),

  updateById: (id, updates) =>
    Category.findByIdAndUpdate(id, updates, {
      new: true, // return the UPDATED document, not the pre-update one
      runValidators: true, // re-apply schema validation on update, not just on create
    }),

  deleteById: (id) => Category.findByIdAndDelete(id),
};
