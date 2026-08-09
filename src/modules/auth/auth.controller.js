// src/modules/auth/auth.controller.js
//
// WHY THIS FILE IS DELIBERATELY THIN:
// A controller's only job is translating HTTP <-> business logic:
// pull data out of the request, call the service, shape the
// response. It should contain ZERO business rules -- no password
// hashing, no "does this email already exist" checks. Those live in
// auth.service.js. If you ever find yourself writing an `if`
// statement in a controller that expresses a business rule (not an
// HTTP concern like "is this field present"), that's a signal it
// belongs in the service instead.

import { authService } from './auth.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const authController = {
  register: asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const { user, token } = await authService.register({ name, email, password });

    // 201 Created -- correct status for successfully creating a new
    // resource, distinct from 200 OK.
    res.status(201).json({ success: true, data: { user, token } });
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const { user, token } = await authService.login({ email, password });

    res.status(200).json({ success: true, data: { user, token } });
  }),
};
