const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const securityController = require("./securityController");
require("dotenv").config();

const { addUser } = require("../db/queries");

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
    .withMessage("Passwords must match")
    .trim(),
];

// internal use functions
function generateErrorMessage(errors) {
  const object = {
    errors: errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
    })),
  };

  return object;
}

// external use functions
const createUser = [
  validateUser,
  async (req, res) => {
    // error check section; if there's an error return 400 with a message
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorObject = generateErrorMessage(errors);
      return res.status(400).json(errorObject);
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);
    const email = req.body.email;
    ˇ;
    const id = await addUser(email, hash);

    if (!id) {
      return res
        .status(400)
        .json({ errors: [{ message: "User with this email already exists" }] });
    }

    const token = await securityController.sign(newUser);
    if (!token) {
      return res
        .status(500)
        .json({ errors: [{ message: "Error generating token" }] });
    }

    const user = { id, email, token };
    return res.status(200).json(user);
  },
];

module.exports = {
  createUser,
};
