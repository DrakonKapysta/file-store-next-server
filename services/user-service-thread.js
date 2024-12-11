const WorkerPool = require("../worker-thread/WorkerPool");
const ApiError = require("../exeptions/api-error");
const path = require("path");
const POOL_SIZE = 4;

const workerPool = new WorkerPool(
  path.resolve(__dirname, "../worker-thread/user-worker.js"),
  POOL_SIZE,
  { defaultName: "user" }
);
class UserService {
  async registration(email, password) {
    try {
      const result = await workerPool.execute({
        type: "register",
        data: { email, password },
      });
      if (result.success) {
        return result.payload;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      throw ApiError.BadRequest(error.message);
    }
  }

  async getAllUsers() {
    try {
      const result = await workerPool.execute({
        type: "getAllUsers",
        data: {},
      });
      if (result.success) {
        return result.payload;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      throw ApiError.BadRequest(error.message);
    }
  }
  async login(email, password) {
    try {
      const result = await workerPool.execute({
        type: "login",
        data: { email, password },
      });
      if (result.success) {
        return result.payload;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      throw ApiError.BadRequest(error.message);
    }
  }
  async logout(refreshToken) {
    try {
      const result = await workerPool.execute({
        type: "logout",
        data: { refreshToken },
      });
      if (result.success) {
        return result.payload;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      throw ApiError.BadRequest(error.message);
    }
  }

  async refresh(refreshToken) {
    try {
      const result = await workerPool.execute({
        type: "refresh",
        data: { refreshToken },
      });
      if (result.success) {
        return result.payload;
      } else {
        throw ApiError.UnauthorizedError();
      }
    } catch (error) {
      throw ApiError.UnauthorizedError();
    }
  }
  async validateToken(accessToken) {
    try {
      const result = await workerPool.execute({
        type: "validateToken",
        data: { accessToken },
      });

      if (result.success) {
        return result.payload;
      } else {
        throw ApiError.UnauthorizedError();
      }
    } catch (error) {
      throw ApiError.UnauthorizedError();
    }
  }
}

module.exports = new UserService();
