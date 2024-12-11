const User = require("../models/user-model");
const File = require("../models/file-model");
const fileService = require("../services/file-service");
const fs = require("fs");
const { v4 } = require("uuid");

class FileController {
  async createDir(req, res) {
    try {
      const { name, type, parent, userId } = req.body;
      const file = new File({
        name,
        type,
        parent,
        user: userId ? userId : req.user.id,
      });
      const parentFile = await File.findOne({ _id: parent });
      if (!parentFile) {
        file.path = name;
        await fileService.createDir(file);
      } else {
        file.path = `${parentFile.path}\\${name}`;
        await fileService.createDir(file);
        parentFile.childs.push(file._id);
        await parentFile.save();
      }
      await file.save();
      return res.json(file);
    } catch (error) {
      console.log(error);
      return res.status(400).json(error);
    }
  }
  async getFiles(req, res) {
    try {
      const { sort } = req.query;
      let files;
      switch (sort) {
        case "name":
          files = await File.find({
            user: req.user.id,
            parent: req.query.parent,
          }).sort({ name: 1 });
          console.log(files);

          break;
        case "type":
          files = await File.find({
            user: req.user.id,
            parent: req.query.parent,
          }).sort({ type: 1 });
          break;
        case "date":
          files = await File.find({
            user: req.user.id,
            parent: req.query.parent,
          }).sort({ date: 1 });
          break;
        default:
          files = await File.find({
            user: req.user.id,
            parent: req.query.parent,
          });
          break;
      }
      return res.json(files);
    } catch (error) {
      console.log(error);

      return res.status(400).json({ message: "Cannot fetch files" });
    }
  }

  async getFilesByUserId(req, res) {
    try {
      const { id, sort } = req.query;
      let files;
      switch (sort) {
        case "name":
          files = await File.find({
            user: id,
            parent: req.query.parent,
          }).sort({ name: 1 });
          break;
        case "type":
          files = await File.find({
            user: id,
            parent: req.query.parent,
          }).sort({ type: 1 });
          break;
        case "date":
          files = await File.find({
            user: id,
            parent: req.query.parent,
          }).sort({ date: 1 });
          break;
        default:
          files = await File.find({
            user: id,
            parent: req.query.parent,
          });
          break;
      }
      return res.json(files);
    } catch (error) {
      console.log(error);

      return res.status(400).json({ message: "Cannot fetch files" });
    }
  }
  async uploadFile(req, res) {
    try {
      const file = req.files.file;

      console.log("Uploading file");

      const userID = req.body.userId ? req.body.userId : req.user.id;

      console.log("User ID: " + userID);
      console.log("req.body.parent: " + req.body.parent);

      const parent = await File.findOne({
        user: userID,
        _id: req.body.parent,
      });
      const user = await User.findOne({ _id: userID });

      if (user.usedSpace + file.size > user.diskSpace) {
        return res
          .status(400)
          .json({ message: "Not enough space on the disk" });
      }

      user.usedSpace += file.size;

      let path;

      if (parent) {
        path = `${process.env.FilePath}\\${user._id}\\${parent.path}\\${file.name}`;
      } else {
        path = `${process.env.FilePath}\\${user._id}\\${file.name}`;
      }

      if (fs.existsSync(path)) {
        return res.status(400).json({ message: "File already exists" });
      }

      file.mv(path);

      const type = file.name.split(".").pop();
      let filePath = file.name;
      if (parent) {
        filePath = parent.path + "\\" + file.name;
      }
      const dbFile = new File({
        name: file.name,
        type,
        user: user._id,
        parent: parent ? parent._id : null,
        path: filePath,
        size: file.size,
      });
      if (parent) {
        await File.findOneAndUpdate(
          { _id: parent._id },
          { $inc: { size: file.size } }
        );
      }

      await dbFile.save();
      await user.save();

      res.status(200).json(dbFile);
    } catch (error) {
      console.log(error);

      return res.status(400).json({ message: "Cannot upload files" });
    }
  }
  async downloadFile(req, res) {
    const { userId, id } = req.query;

    try {
      const file = await File.findOne({
        _id: id,
        user: userId ? userId : req.user.id,
      });
      const path = `${process.env.FilePath}\\${
        userId ? userId : req.user.id
      }\\${file.path}`;
      console.log(path);

      if (fs.existsSync(path)) {
        console.log("File exists");

        return res.download(path, file.name);
      }
      return res.status(400).json({ message: "File does not exist" });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: "Cannot download files" });
    }
  }

  async deleteFile(req, res) {
    try {
      const file = await File.findOne({ _id: req.query.id });

      const parentId = req.query.parent;

      if (!file) {
        return res.status(400).json({ message: "File not found" });
      }
      fileService.deleteFile(file);
      if (parentId) {
        try {
          const parentFile = await File.findOne({ _id: parentId });

          if (parentFile) {
            const newSize = Math.max(0, parentFile.size - file.size);

            await File.findOneAndUpdate(
              { _id: parentId },
              { $set: { size: newSize } }
            );
          }
        } catch (error) {
          console.log(
            `Error updating parent size for file ID ${parentId}:`,
            error
          );
        }
      }
      await file.deleteOne();
      return res
        .status(200)
        .json({ deletedFileId: file._id, message: "File deleted" });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: "Cannot delete file" });
    }
  }
  async searchFile(req, res) {
    try {
      const searchName = req.query.search;
      let files = await File.find({ user: req.user.id });
      files = files.filter((file) =>
        file.name.toLocaleLowerCase().includes(searchName.toLocaleLowerCase())
      );
      return res.json(files);
    } catch (e) {
      console.log(e);
      return res.status(400).json({ message: "Search error" });
    }
  }
  async searchFileByUserId(req, res) {
    try {
      const { id, search } = req.query;
      let files = await File.find({ user: id });
      files = files.filter((file) =>
        file.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())
      );
      return res.json(files);
    } catch (e) {
      console.log(e);
      return res.status(400).json({ message: "Search error" });
    }
  }

  async uploadAvatar(req, res) {
    try {
      const file = req.files.file;
      const user = await User.findById(req.user.id);
      const avatarName = v4() + ".jpg";
      file.mv(process.env.AvatarPath + "\\" + avatarName);
      user.avatar = avatarName;
      await user.save();
      return res.status(200).json(user);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: "Cannot upload avatar" });
    }
  }
  async deleteAvatar(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (fs.existsSync(process.env.AvatarPath + "\\" + user.avatar)) {
        fs.unlinkSync(process.env.AvatarPath + "\\" + user.avatar);
        user.avatar = null;
      }
      await user.save();
      return res.status(200).json(user);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: "Cannot upload avatar" });
    }
  }
}

module.exports = new FileController();
