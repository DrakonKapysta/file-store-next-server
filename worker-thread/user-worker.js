const { parentPort, workerData } = require("worker_threads");
const bcrypt = require("bcrypt");
const UserDto = require("../dtos/user-dto");
const userModel = require("../models/user-model");
const roleModel = require("../models/role-model");
const connectDb = require("./connectDb");
const tokenService = require("../services/token-service");
const ApiError = require("../exeptions/api-error");
const fileService = require("../services/file-service");
const File = require("../models/file-model");

connectDb().then(() => {
  parentPort.on("message", async (task) => {
    const { type, data } = task;

    try {
      if (type === "register") {
        const { email, password } = data;

        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
          throw new Error(`User with email ${email} already exists`);
        }
        const hashPassword = await bcrypt.hash(password, 3);
        const role = await roleModel.findOne({ value: "USER" });
        const user = await userModel.create({
          email,
          password: hashPassword,
          roles: [role.value],
        });

        await fileService.createDir(new File({ user: user.id, name: "" }));

        const userDto = new UserDto(user);

        const tokens = tokenService.generateTokens({ ...userDto });
        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        parentPort.postMessage({
          payload: { ...tokens, user: userDto },
          success: true,
        });
      } else if (type === "getAllUsers") {
        const users = await userModel.find();
        if (!users) {
          throw new Error("Users not found");
        }

        parentPort.postMessage({
          payload: users.map((user) => new UserDto(user)),
          success: true,
        });
      } else if (type === "login") {
        const { email, password } = data;
        const user = await userModel.findOne({ email });
        if (!user) {
          throw ApiError.BadRequest("User not found");
        }
        const isPassEqual = await bcrypt.compare(password, user.password);
        if (!isPassEqual) {
          throw ApiError.BadRequest("Wrong password.");
        }
        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({ ...userDto });

        console.log("Tokens generated with login==", tokens);
        console.log("user id: ", userDto.id);

        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        parentPort.postMessage({
          payload: { ...tokens, user: userDto },
          success: true,
        });
      } else if (type === "logout") {
        const { refreshToken } = data;
        const token = await tokenService.removeToken(refreshToken);
        parentPort.postMessage({
          payload: { token },
          success: true,
        });
      } else if (type === "refresh") {
        const { refreshToken } = data;

        if (!refreshToken) {
          throw ApiError.UnauthorizedError();
        }
        const userData = tokenService.validateRefreshToken(refreshToken);

        const tokenFromDb = await tokenService.findToken(refreshToken);

        if (!userData || !tokenFromDb) {
          throw ApiError.UnauthorizedError();
        }

        const user = await userModel.findById(userData.id);

        const userDto = new UserDto(user);
        const tokens = tokenService.generateTokens({ ...userDto });
        await tokenService.saveToken(userDto.id, tokens.refreshToken);

        parentPort.postMessage({
          payload: { ...tokens, user: userDto },
          success: true,
        });
      } else if (type === "validateToken") {
        const { accessToken } = data;

        const userData = tokenService.validateAccessToken(accessToken);

        if (!userData) {
          return parentPort.postMessage({
            payload: null,
            success: false,
          });
        }

        const user = await userModel.findById(userData.id);
        const userDto = new UserDto(user);
        parentPort.postMessage({
          payload: { user: userDto },
          success: true,
        });
      }
    } catch (error) {
      parentPort.postMessage({ success: false, error: error.message });
    }
  });
});
