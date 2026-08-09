// src/modules/auth/auth.service.js
//
// WHY THIS FILE EXISTS:
// This is where the actual business rules of authentication live:
// "a password must be hashed before storage," "an email must be
// unique," "login requires a matching password," "identity is
// proven via a signed JWT." None of this belongs in a controller
// (which only knows about HTTP) or the model (which only knows
// about data shape and validation) -- it belongs here.
//
// auth.service.js depends on user.repository.js for persistence,
// but user.repository.js and user.model.js know nothing about
// bcrypt, JWTs, or auth at all. That's intentional: persistence and
// business logic are separate concerns, and this file is where
// they meet.

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../users/user.repository.js';
import { AppError } from '../../utils/AppError.js';
import { env } from '../../config/env.js';

const SALT_ROUNDS = 10; // Cost factor for bcrypt hashing -- higher = slower but more resistant to brute force. 10 is a widely-used, sane default.

const generateToken = (userId) => {
  // The JWT payload only needs enough to identify the user later --
  // NEVER put sensitive data (password, passwordHash) inside a JWT
  // payload. JWTs are signed, not encrypted -- anyone holding the
  // token can decode and read the payload, they just can't forge a
  // valid signature for a tampered one.
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
};

export const authService = {
  register: async ({ name, email, password }) => {
    const existingUser = await userRepository.findByEmail(email);

    if (existingUser) {
      // 409 Conflict is the correct status code for "this resource
      // already exists" -- distinct from 400 (malformed request) or
      // 422 (semantically invalid). Precision here matters: API
      // consumers (and future you) rely on status codes to branch
      // logic without parsing message strings.
      throw new AppError('An account with this email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userRepository.create({ name, email, passwordHash });

    const token = generateToken(user._id);
    return { user, token };
  },

  login: async ({ email, password }) => {
    const user = await userRepository.findByEmail(email);

    // Deliberately identical error for "no such user" and "wrong
    // password." If we said "user not found" vs "wrong password"
    // differently, an attacker could use that difference to
    // discover which emails are registered in our system
    // (a real vulnerability class called user enumeration).
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken(user._id);
    return { user, token };
  },
};
