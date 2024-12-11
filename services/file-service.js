const fs = require("fs");
const File = require("../models/file-model");
const path = require("path");

class FileService {
  createDir(file) {
    const user = String(file.user);
    const filePath = path.join(
      process.env.FilePath,
      user,
      file.path ? String(file.path) : ""
    );

    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(filePath)) {
          fs.mkdirSync(filePath);

          return resolve({ message: "File Created" });
        } else {
          return reject({ message: "File Already Exists" });
        }
      } catch (error) {
        console.log(error);

        return reject({ message: "File Error" });
      }
    });
  }

  deleteFile(file) {
    const path = this.getFilePath(file);
    if (file.type === "dir") {
      fs.rmdirSync(path);
    } else {
      fs.unlinkSync(path);
    }
  }

  getFilePath(file) {
    return process.env.FilePath + "\\" + String(file.user) + "\\" + file.path;
  }
}

module.exports = new FileService();
