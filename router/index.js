const Router = require("express").Router;
const userController = require("../controllers/user-controller");
const { body } = require("express-validator");
const router = new Router();
const authMiddleware = require("../middlewares/auth-middleware");
const roleMiddleware = require("../middlewares/role-middleware");

router.get(
  "/users",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  userController.getUsers
);
router.get(
  "/users/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  userController.getUserById
);
router.post(
  "/registration",
  body("email").isEmail(),
  body("password").isLength({ min: 3, max: 32 }),
  userController.registration
);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.get("/refresh", userController.refresh);
router.get("/validate-token", userController.validateToken);

module.exports = router;
