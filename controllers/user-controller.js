const userServiceThread = require("../services/user-service-thread");
const { validationResult } = require("express-validator");
const ApiError = require("../exeptions/api-error");
const tokenService = require("../services/token-service");
const userModel = require("../models/user-model");
const fileModel = require("../models/file-model");
class UserController {
  async registration(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return next(ApiError.BadRequest("Validation error", errors.array()));
      }
      const { email, password } = req.body;

      const userData = await userServiceThread.registration(email, password);
      res.cookie("refreshToken", userData.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });
      res.cookie("accessToken", userData.accessToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });
      return res.json(userData);
    } catch (error) {
      next(error);
    }
  }
  async getUsers(req, res, next) {
    try {
      const users = await userModel.find({ roles: { $nin: ["ADMIN"] } });
      return res.json(users);
    } catch (error) {
      next(error);
    }
  }
  async getUserById(req, res, next) {
    console.log("GeT USER BY ID", req.params.id);

    try {
      const user = await userModel.find({ _id: req.params.id });

      return res.json(user);
    } catch (error) {
      next(error);
    }
  }
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const userData = await userServiceThread.login(email, password);
      res.cookie("refreshToken", userData.refreshToken, {
        expires: new Date(Date.now() + 86400000),
        httpOnly: true,
      });
      console.log("Generated token refresh: ", userData.refreshToken);

      res.cookie("accessToken", userData.accessToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });
      return res.status(200).json(userData);
    } catch (error) {
      next(error);
    }
  }
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      const token = await userServiceThread.logout(refreshToken);
      res.clearCookie("refreshToken");
      return res.status(200).json(token);
    } catch (error) {
      next(error);
    }
  }
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.cookies;

      console.log("Refresh token: ", refreshToken);

      const userData = await userServiceThread.refresh(refreshToken);

      console.log("User DATA: ", userData);

      res.cookie("refreshToken", userData.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });
      res.cookie("accessToken", userData.accessToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
      });

      return res.status(200).json(userData);
    } catch (error) {
      console.log(error);

      next(error);
    }
  }
  async validateToken(req, res, next) {
    try {
      const { accessToken } = req.cookies;
      const token = await userServiceThread.validateToken(accessToken);
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      return res.status(200).json(token);
    } catch (error) {
      next(ApiError.UnauthorizedError());
    }
  }
}

module.exports = new UserController();
