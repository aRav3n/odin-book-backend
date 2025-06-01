const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const security = require("./securityController");
require("dotenv").config();

const { addUser, getUser, getUserEmail } = require("../db/queries");
const {
  generateErrorMessageFromArray,
  generateIndividualErrorMessage,
  trimFields,
  validateUser,
} = require("./internalFunctions");

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

async function getEmail(req, res) {
  const userId = req.user.user.id;
  const email = await getUserEmail(userId);

  if (!email) {
    return res
      .status(400)
      .json(
        generateIndividualErrorMessage(
          "Could not find your email in the database!"
        )
      );
  }

  console.log("gets:", email);
  return res.status(200).json({ email });
}

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
  getEmail,
  loginUser,
};
