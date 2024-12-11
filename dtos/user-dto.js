module.exports = class UserDto {
  email;
  id;
  roles;
  avatar;
  constructor(model) {
    this.email = model.email;
    this.id = model._id;
    this.roles = [...model.roles];
    this.avatar = model.avatar;
  }
};
