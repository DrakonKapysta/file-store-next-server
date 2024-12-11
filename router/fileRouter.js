const Router = require("express").Router;
const router = new Router();
const authMiddleware = require("../middlewares/auth-middleware");
const fileController = require("../controllers/file-controller");

router.post("", authMiddleware, fileController.createDir);
router.post("/upload", authMiddleware, fileController.uploadFile);
router.get("", authMiddleware, fileController.getFiles);
router.get(
  "/getFilesByUserId",
  authMiddleware,
  fileController.getFilesByUserId
);
router.get("/download", authMiddleware, fileController.downloadFile);
router.delete("/", authMiddleware, fileController.deleteFile);
router.get("/search", authMiddleware, fileController.searchFile);
router.get(
  "/searchByUserId",
  authMiddleware,
  fileController.searchFileByUserId
);
router.post("/upload-avatar", authMiddleware, fileController.uploadAvatar);
router.delete("/delete-avatar", authMiddleware, fileController.deleteAvatar);

module.exports = router;
