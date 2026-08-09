// src/modules/categories/category.model.js
//
// WHY THIS FILE EXISTS:
// Implements the nullable-owner pattern decided in Milestone 1:
// owner === null means a default/global category visible to every
// user; owner === <userId> means a category created by, and
// visible only to, that specific user.

import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    // null = default/global category (visible to everyone).
    // ObjectId = user-created category (visible only to its owner).
    // Deliberately NOT `required: true` -- absence of an owner is a
    // valid, meaningful state here, not missing data.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

export const Category = mongoose.model('Category', categorySchema);
