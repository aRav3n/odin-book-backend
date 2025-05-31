const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const security = require("./securityController");
require("dotenv").config();

const { addUser, getUser } = require("../db/queries");
const { error } = require("console");

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

const trimFields = [body("email").trim(), body("password").trim()];

// internal use functions
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

// external use functions
const createUser = [
  validateUser,
  async (req, res) => {
    // error check section; if there's an error return 400 with a message
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorObject = generateErrorMessageFromArray(errors);
      return res.status(400).json(errorObject);
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);
    const email = req.body.email;
    const id = await addUser(email, hash);

    if (!id) {
      const errorMessage = generateIndividualErrorMessage(
        "User with this email already exists."
      );
      return res.status(400).json(errorMessage);
    }

    const user = { id, email };

    return res.status(200).json(user);
  },
];

const loginUser = [
  trimFields,
  async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    if (!email || !password) {
      const message = generateIndividualErrorMessage(
        "You need an email and password to log in."
      );
      return res.status(403).json(message);
    }

    const user = await getUser(email);
    if (!user) {
      const message = generateIndividualErrorMessage(
        "No user with this email exists in the database."
      );
      return res.status(403).json(message);
    }

    const passwordIsValid = bcrypt.compareSync(password, user.hash);
    if (!passwordIsValid) {
      const message = generateIndividualErrorMessage(
        "That password doesn't work; please try again."
      );
      return res.status(403).json(message);
    }

    const token = security.sign(user);
    const { hash, ...userObject } = user;
    userObject.token = token;

    return res.status(200).json(userObject);
  },
];

module.exports = {
  createUser,
  loginUser,
};
