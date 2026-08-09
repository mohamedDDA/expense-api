// src/middleware/validate.js
//
// WHY THIS FILE EXISTS:
// This is a single, reusable middleware FACTORY -- a function that
// takes a Zod schema and returns Express middleware tailored to it.
// Every route that needs validation calls validate(someSchema)
// instead of hand-writing its own if-checks. This is what lets
// validation live as a true separate layer: routes declare WHAT
// shape they expect, this file handles HOW that gets checked and
// rejected, uniformly, everywhere.
//
// WHY IT LIVES IN middleware/, NOT inside any single module:
// Every module (auth, categories, expenses) needs this -- same
// "used by many, owned by none" reasoning as authenticate.js and
// errorHandler.js from earlier milestones.

import { AppError } from '../utils/AppError.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    // Flatten Zod's error tree into a simple, readable message
    // instead of exposing its internal error object shape directly
    // to API consumers -- our error responses should have a
    // consistent shape regardless of which library validated them.
    const message = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new AppError(`Validation failed - ${message}`, 400);
  }

  // Replace req.body with the PARSED data, not the raw input.
  // Zod can coerce/transform values (e.g. trimming strings), so
  // downstream code should use the validated, normalized version --
  // not the original untrusted req.body.
  req.body = result.data;
  next();
};
