// src/modules/users/user.model.js
//
// WHY THIS FILE EXISTS:
// This is the Mongoose schema for User -- the single source of
// truth for what a User document looks like and what basic
// validation rules it must satisfy at the database layer.
//
// WHY IT LIVES IN modules/users/ (not modules/auth/):
// "User" is a resource/entity -- data that exists independently of
// how someone authenticates. "Auth" is a *process* (verifying
// identity, issuing tokens) that operates ON a User. Other future
// features might need to read User data without touching anything
// auth-related (e.g. showing a user's display name on their
// expenses). Coupling the User model inside auth/ would force
// those unrelated features to import from auth/, which is exactly
// the cross-module coupling smell we identified in Milestone 2.
//
// NOTE: we deliberately are NOT adding fields like `role` or
// `isVerified` here. Nothing in our current scope reads or acts on
// them -- adding them now would be unused complexity sitting in the
// schema. Add them when a real feature needs them, not before.

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true, // normalizes so "A@b.com" and "a@b.com" are treated as the same user
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      // NOTE: we never store or accept a raw "password" field on
      // this model. Hashing happens in the service layer BEFORE a
      // document is ever created -- the model only ever sees and
      // stores the already-hashed value. This is deliberate: the
      // model shouldn't need to know or care how hashing works.
    },
  },
  {
    // Automatically adds and maintains createdAt / updatedAt fields.
    // Near-zero cost, real value for debugging and support queries.
    timestamps: true,
  }
);

// Ensures a User document, when converted to JSON (e.g. in an API
// response), never includes passwordHash -- even by accident. This
// runs automatically any time res.json(user) is called on a User
// document, so no controller has to remember to strip it manually.
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const User = mongoose.model('User', userSchema);
