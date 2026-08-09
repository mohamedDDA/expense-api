// src/modules/auth/auth.routes.js
//
// WHY THIS FILE EXISTS:
// Routes define WHICH URL + HTTP method maps to WHICH controller
// function. Keeping this separate from the controller means the
// controller file can be tested/reasoned about independently of
// Express's routing syntax, and the "API surface" of this module is
// visible at a glance in one small file.
//
// These routes are intentionally NOT protected by auth middleware --
// you can't require a valid token to register or log in, since the
// whole point is obtaining one.

import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema } from './auth.validation.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

export default router;
