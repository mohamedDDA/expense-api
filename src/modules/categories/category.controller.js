// src/modules/categories/category.controller.js

import { categoryService } from './category.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const categoryController = {
  getAll: asyncHandler(async (req, res) => {
    const categories = await categoryService.getVisibleCategories(req.user.id);
    res.status(200).json({ success: true, data: categories });
  }),

  create: asyncHandler(async (req, res) => {
    const { name } = req.body;
    const category = await categoryService.createCategory({ name, userId: req.user.id });
    res.status(201).json({ success: true, data: category });
  }),

  update: asyncHandler(async (req, res) => {
    const { name } = req.body;
    const category = await categoryService.updateCategory({
      categoryId: req.params.id,
      name,
      userId: req.user.id,
    });
    res.status(200).json({ success: true, data: category });
  }),

  remove: asyncHandler(async (req, res) => {
    await categoryService.deleteCategory({
      categoryId: req.params.id,
      userId: req.user.id,
    });
    // 204 No Content -- correct status for a successful DELETE with
    // no body to return. Sending 200 with an empty object is a
    // common inconsistency; 204 is the precise, correct signal.
    res.status(204).send();
  }),
};
