const validator = require("validator");
const isEmpty = require("./is-empty");
var strongRegex = new RegExp(
  "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])"
);

module.exports = function validateRegisterInput(data) {
  let errors = {};
  data.username = !isEmpty(data.username) ? data.username : "";
  data.email = !isEmpty(data.email) ? data.email : "";
  data.password = !isEmpty(data.password) ? data.password : "";
  data.confirmPassword = !isEmpty(data.confirmPassword)
    ? data.confirmPassword
    : "";

  if (!validator.isLength(data.username, { min: 2, max: 30 })) {
    errors.username = "Username must be between 2 and 30 characters";
  }
  if (validator.isEmpty(data.username)) {
    errors.username1 = "Username field is required";
  }
  if (validator.isEmpty(data.email)) {
    errors.email = "Email field is required";
  }
  if (!validator.isEmail(data.email)) {
    errors.email1 = "Email is invalid";
  }
  if (validator.isEmpty(data.password)) {
    errors.password = "Password field is required";
  }
  if (!validator.isLength(data.password, { min: 8, max: 16 })) {
    errors.password1 =
      "Password must be at least 8 characters and there should be maximum 16 characters";
  }
  if (!strongRegex.test(data.password)) {
    errors.password2 =
      "Password must have atleast 1 uppercase, 1 lowercase, 1 number and 1 special character";
  }
  if (validator.isEmpty(data.confirmPassword)) {
    errors.confirmPassword = "Confirm Password field is required";
  }
  if (!validator.equals(data.password, data.confirmPassword)) {
    errors.confirmPassword1 = "Passwords must match";
  }

  return {
    errors, //key and value were both errors so we keep only one
    isValid: isEmpty(errors),
  };
};
