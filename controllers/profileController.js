const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const security = require("./securityController");
require("dotenv").config();

const {
  addProfile,
  getProfile,
  updateExistingProfile,
} = require("../db/queries");
const {
  generateErrorMessageFromArray,
  generateIndividualErrorMessage,
  validateProfile,
} = require("./internalFunctions");

const createProfile = [
  validateProfile,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorObject = generateErrorMessageFromArray(errors);
      return res.status(400).json(errorObject);
    }

    if (!req.body.name || req.body.name.length === 0) {
      return res
        .status(400)
        .json(generateIndividualErrorMessage("Name cannot be blank."));
    }
    const userId = req.user.user.id;
    const about = req.body.about || "";
    const website = req.body.website || "";

    const profile = await addProfile(userId, req.body.name, about, website);

    if (!profile) {
      return res
        .status(500)
        .json(
          generateIndividualErrorMessage(
            "There was an error creating your profile. Please make sure you're signed in, then try that again."
          )
        );
    }

    return res.status(200).json(profile);
  },
];

async function readProfile(req, res) {
  const id = Number(req.params.profileId);
  const profile = await getProfile(id);

  if (!profile) {
    return res
      .status(404)
      .json(
        generateIndividualErrorMessage(
          "Could not find that profile, please try again."
        )
      );
  }

  return res.status(200).json(profile);
}

async function updateProfile(req, res) {
  const id = Number(req.body.id);
  const userId = Number(req.user.user.id);
  const name = req.body.name;
  const website = req.body.website || "";
  const about = req.body.about || "";

  if (!name || name.length === 0) {
    return res
      .status(400)
      .json(generateIndividualErrorMessage("The name field cannot be blank."));
  }

  const updatedProfile = await updateExistingProfile(
    id,
    userId,
    name,
    website,
    about
  );

  if (!updatedProfile) {
    return res
      .status(404)
      .json(
        generateIndividualErrorMessage(
          "Could not find a profile that matches the provided user login, please sign in again and retry."
        )
      );
  }

  return res.status(200).json(updatedProfile);
}

module.exports = { createProfile, readProfile, updateProfile };
