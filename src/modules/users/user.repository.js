// src/modules/users/user.repository.js
//
// WHY THIS FILE EXISTS:
// Isolates all direct Mongoose/MongoDB queries for User behind a
// small set of named functions. auth.service.js will call
// findByEmail() and create() without knowing or caring that
// Mongoose is the tool doing the work underneath.
//
// WHY THIS MATTERS HERE SPECIFICALLY: findByEmail() is called on
// every login attempt and every registration (to check for
// duplicates). If we ever needed to add a query optimization (e.g.
// .select('+passwordHash') if we later made it not-selected-by-default,
// or added an index-aware query), we'd change it in exactly one
// place, and every caller benefits automatically.

import { User } from './user.model.js';

export const userRepository = {
  findByEmail: (email) => User.findOne({ email }),
  findById: (id) => User.findById(id),
  create: (userData) => User.create(userData),
};
