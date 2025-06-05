const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const security = require("./securityController");
require("dotenv").config();

const {
  addUser,
  deleteSingleUser,
  getUser,
  getUserEmail,
  updateUserInfo,
} = require("../db/queries");
const {
  generateErrorMessageFromArray,
  generateIndividualErrorMessage,
  trimFields,
  validateUpdate,
  validateUser,
} = require("./internalFunctions");

// external use functions
const createUser = [
  validateUser,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorObject = generateErrorMessageFromArray(errors);
      return res.status(400).json(errorObject);
    }

    const email = req.body.email;
    const existingUser = await getUser(email);
    if (existingUser) {
      const errorMessage = generateIndividualErrorMessage(
        "User with this email already exists."
      );
      return res.status(400).json(errorMessage);
    }

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);
    const id = await addUser(email, hash);
    const user = { id, email };

    return res.status(200).json(user);
  },
];

async function deleteUser(req, res) {
  const password = req.body.password;
  if (!password) {
    return res
      .status(403)
      .json(
        generateIndividualErrorMessage(
          "You have to be logged in to your account to access that."
        )
      );
  }

  const user = req.user.user;

  const passwordIsValid = bcrypt.compareSync(password, user.hash);
  if (!passwordIsValid) {
    const message = generateIndividualErrorMessage(
      "The password you entered is incorrect."
    );
    return res.status(403).json(message);
  }

  const deletedUserAccount = await deleteSingleUser(user.id);

  if (
    !deletedUserAccount ||
    deletedUserAccount.id !== user.id ||
    deletedUserAccount.email !== user.email ||
    deletedUserAccount.hash !== user.hash
  ) {
    return res
      .status(404)
      .json(
        generateIndividualErrorMessage(
          `An account for ${user.email} was not found!`
        )
      );
  }

  return res.status(200).json({ message: "Account successfully deleted." });
}

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

const updateUser = [
  validateUpdate,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorObject = generateErrorMessageFromArray(errors);
      return res.status(400).json(errorObject);
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.currentPassword,
      req.user.user.hash
    );
    if (!passwordIsValid) {
      const message = generateIndividualErrorMessage(
        "Your current password is incorrect."
      );
      return res.status(403).json(message);
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(req.body.newPassword, salt);
    const successfulUpdate = await updateUserInfo(
      req.user.user.id,
      req.body.newEmail,
      newHash
    );

    if (!successfulUpdate) {
      return res
        .status(500)
        .json(
          generateIndividualErrorMessage(
            "Something went wrong with the update!"
          )
        );
    }

    const token = security.sign(successfulUpdate);
    const { hash, ...userObject } = successfulUpdate;
    userObject.token = token;

    return res.status(200).json(userObject);
  },
];

module.exports = {
  createUser,
  deleteUser,
  getEmail,
  loginUser,
  updateUser,
};
