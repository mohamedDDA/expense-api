// src/modules/expenses/expense.controller.js

import { expenseService } from './expense.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const expenseController = {
  getAll: asyncHandler(async (req, res) => {
    const expenses = await expenseService.getAllExpenses(req.user.id);
    res.status(200).json({ success: true, data: expenses });
  }),

  create: asyncHandler(async (req, res) => {
    const { amount, description, date, categoryId } = req.body;
    const expense = await expenseService.createExpense({
      amount,
      description,
      date,
      categoryId,
      userId: req.user.id,
    });
    res.status(201).json({ success: true, data: expense });
  }),

  update: asyncHandler(async (req, res) => {
    const expense = await expenseService.updateExpense({
      expenseId: req.params.id,
      updates: req.body,
      userId: req.user.id,
    });
    res.status(200).json({ success: true, data: expense });
  }),

  remove: asyncHandler(async (req, res) => {
    await expenseService.deleteExpense({
      expenseId: req.params.id,
      userId: req.user.id,
    });
    res.status(204).send();
  }),

  getTotals: asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const totals = await expenseService.getCategoryTotals({
      userId: req.user.id,
      // Query params always arrive as strings or undefined -- `new
      // Date(undefined)` produces an Invalid Date, not undefined, so
      // we explicitly pass undefined through rather than
      // constructing a Date from a possibly-missing value.
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    res.status(200).json({ success: true, data: totals });
  }),
};
