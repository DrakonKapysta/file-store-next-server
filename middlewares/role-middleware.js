const ApiError = require("../exeptions/api-error");

module.exports = function (roles) {
  return function (req, res, next) {
    if (!req.user) return next(ApiError.UnauthorizedError());

    if (req.user.roles.some((role) => roles.includes(role))) {
      next();
    } else {
      return next(ApiError.Forbidden());
    }
  };
};
