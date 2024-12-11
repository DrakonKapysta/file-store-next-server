const { Schema, model } = require("mongoose");

const UserSchema = new Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  diskSpace: { type: Number, default: 1024 ** 3 * 10 },
  usedSpace: { type: Number, default: 0 },
  roles: [{ type: String, ref: "Role" }],
  avatar: { type: String, default: "" },
  files: [{ type: Schema.Types.ObjectId, ref: "File" }],
});

module.exports = model("User", UserSchema);
