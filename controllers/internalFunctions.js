const { body } = require("express-validator");
const jwt = require("jsonwebtoken");

function generateErrorMessageFromArray(errorArray) {
  const object = {
    errors: errorArray.array().map((err) => ({
      message: err.msg,
    })),
  };

  return object;
}

function generateIndividualErrorMessage(message) {
  return {
    errors: [{ message: message }],
  };
}

function getTokenFromReq(req) {
  const bearerHeader = req.headers["authorization"];
  if (bearerHeader !== undefined) {
    const bearer = bearerHeader.split(" ");
    const token = bearer[bearer.length - 1];
    return token;
  }
  return null;
}

function getUserInfoFromToken(token, secretKey) {
  const user = jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return null;
    }
    return decoded;
  });
  return user;
}

const trimFields = [body("email").trim(), body("password").trim()];

const validateProfile = [
  body("name")
    .trim()
    .exists({ checkFalsy: true })
    .withMessage("Name must exist.")
    .bail()
    .notEmpty()
    .withMessage("Name must not be blank."),
  body("about").trim(),
  body("website")
    .trim()
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage("Website must be a valid URL."),
];

const validateUpdate = [
  body("currentPassword").trim(),
  body("newEmail")
    .trim()
    .isEmail()
    .withMessage("Your new email must be a valid email address."),
  body("newPassword")
    .trim()
    .isLength({ min: 6, max: 16 })
    .withMessage("Your new password must be between 6 and 16 characters."),
  body("newPasswordConfirm")
    .exists()
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        return false;
      }
      return true;
    })
    .withMessage("Password confirmation must match.")
    .trim(),
];

const validateUser = [
  body("email").trim().isEmail().withMessage("Must be a valid email address."),
  body("password")
    .trim()
    .isLength({ min: 6, max: 16 })
    .withMessage("Password must be between 6 and 16 characters."),
  body("confirmPassword")
    .exists()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        return false;
      }
      return true;
    })
    .withMessage("Passwords must match.")
    .trim(),
];

module.exports = {
  generateErrorMessageFromArray,
  generateIndividualErrorMessage,
  getTokenFromReq,
  getUserInfoFromToken,
  trimFields,
  validateProfile,
  validateUpdate,
  validateUser,
};
