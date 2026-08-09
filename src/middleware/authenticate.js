// src/middleware/authenticate.js
//
// WHY THIS FILE EXISTS:
// Protected routes (categories, expenses) need to know WHO is
// making the request before any business logic runs. This
// middleware verifies the JWT sent in the Authorization header,
// fetches the corresponding user from the database, and attaches
// it to req.user -- so every downstream controller can simply read
// req.user.id without re-implementing token verification itself.
//
// WHY IT LIVES IN middleware/, NOT modules/auth/:
// It's used by multiple unrelated modules (categories, expenses,
// and any future protected module) -- see the Milestone 2 rule:
// "used by many modules" belongs in a shared folder, not inside
// the auth module itself. auth/ owns issuing tokens; this file
// owns verifying them on protected routes, which is a distinct,
// cross-cutting concern.
//
// DESIGN DECISION: we fetch the full user from the database on
// every request, rather than trusting the decoded JWT payload
// alone. A JWT cannot be revoked before it expires -- if we only
// trusted the payload, a deleted user's token would keep working
// perfectly until natural expiry. Paying one indexed findById query
// per request buys us immediate correctness if a user is deleted.
// See DECISIONS.md for the full tradeoff discussion.

import jwt from 'jsonwebtoken';
import { userRepository } from '../modules/users/user.repository.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required', 401);
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    // jwt.verify throws for BOTH an invalid signature AND an
    // expired token. We deliberately don't distinguish between
    // these to the client -- either way, the correct client action
    // is identical: "log in again." Distinguishing them here adds
    // complexity without giving the client anything useful to do
    // differently.
    throw new AppError('Invalid or expired token', 401);
  }

  const user = await userRepository.findById(decoded.userId);

  if (!user) {
    // The user existed when the token was issued, but doesn't
    // anymore -- e.g. their account was deleted. Reject rather than
    // letting a stale token keep working.
    throw new AppError('User no longer exists', 401);
  }

  req.user = user;
  next();
});
