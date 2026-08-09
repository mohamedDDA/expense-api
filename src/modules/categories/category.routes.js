// src/modules/categories/category.routes.js
//
// This is the first module where `authenticate` is actually
// mounted -- proving the Milestone 7 decision (selective, not
// global, auth middleware) in practice. Every route here requires
// a valid token; there is no public category route.

import { Router } from 'express';
import { categoryController } from './category.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from './category.validation.js';

const router = Router();

router.use(authenticate); // applies to every route defined below this line

router.get('/', categoryController.getAll);
router.post('/', validate(createCategorySchema), categoryController.create);
router.put('/:id', validate(updateCategorySchema), categoryController.update);
router.delete('/:id', categoryController.remove);

export default router;
