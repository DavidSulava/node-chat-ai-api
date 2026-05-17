/**
 * Wraps an async Express route handler and forwards any rejected promise
 * to the next error‑handling middleware.
 *
 * Usage:
 *   router.get('/path', catchAsync(async (req, res, next) => { ... }));
 */
export const catchAsync = (fn) => {
    return (_req, _res, _next) => {
        fn(_req, _res, _next).catch(_next);
    };
};
