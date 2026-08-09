// src/modules/expenses/expense.routes.js

import { Router } from 'express';
import { expenseController } from './expense.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { createExpenseSchema, updateExpenseSchema } from './expense.validation.js';

const router = Router();

router.use(authenticate);

// IMPORTANT: this route must be registered BEFORE any '/:id' routes.
// Express matches routes top-to-bottom -- if '/:id' were registered
// first, a request to GET /api/expenses/totals would incorrectly
// match '/:id' with id="totals" instead of reaching this handler.
router.get('/totals', expenseController.getTotals);

router.get('/', expenseController.getAll);
router.post('/', validate(createExpenseSchema), expenseController.create);
router.put('/:id', validate(updateExpenseSchema), expenseController.update);
router.delete('/:id', expenseController.remove);

export default router;
