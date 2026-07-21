// Wraps an async controller/middleware function so any rejected promise
// is forwarded to Express's error handler via next().
function catchAsync(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = catchAsync;
