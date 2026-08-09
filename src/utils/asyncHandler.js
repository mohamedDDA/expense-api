// src/utils/asyncHandler.js
//
// WHY THIS FILE EXISTS:
// Express does NOT automatically catch errors thrown inside async
// route handlers. If an `async` controller function throws (e.g. a
// failed `await User.findById(...)`), and you haven't wrapped it in
// try/catch, the promise rejection is silently swallowed -- the
// request just hangs, or the process crashes, with no clean error
// response sent to the client.
//
// The common beginner fix is wrapping every single controller in
// its own try/catch block that calls next(err). That works, but
// it's repetitive boilerplate duplicated across every controller
// method in the project.
//
// asyncHandler wraps a controller function once, catching any
// rejected promise and forwarding it to next(err) automatically --
// which routes it straight into our errorHandler middleware above.
//
// This is a small function, but it's one of the most common
// patterns you'll see in real Express codebases, and skipping it is
// one of the most common sources of "the server just hangs" bugs
// in projects built by developers who haven't hit this issue yet.

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
