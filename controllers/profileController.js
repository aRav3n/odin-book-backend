const { validationResult } = require("express-validator");

const {
  addProfile,
  deleteUserProfile,
  getProfile,
  getUserProfile,
  updateExistingProfile,
} = require("../db/queries");

const {
  generateErrorMessageFromArray,
  generateIndividualErrorMessage,
  generateErrorRes,
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
  const profile = await getProfile(req.profileId);

  if (!profile) {
    return generateErrorRes(
      res,
      404,
      "Could not find that profile, please try again."
    );
  }

  return res.status(200).json(profile);
}

async function readUserProfile(req, res) {
  const userId = req.user.user.id;
  const profile = await getUserProfile(userId);

  if (!profile) {
    return generateErrorRes(res, 404, "No profile found for your account.");
  }

  return res.status(200).json(profile);
}

const updateProfile = [
  validateProfile,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorObject = generateErrorMessageFromArray(errors);
      return res.status(400).json(errorObject);
    }

    const id = Number(req.body.id);
    const userId = Number(req.user.user.id);
    const name = req.body.name;
    const website = req.body.website || "";
    const about = req.body.about || "";

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
  },
];

async function deleteProfile(req, res) {
  const deletedProfile = await deleteUserProfile(req.profileId);

  if (!deletedProfile) {
    return res
      .status(404)
      .json(
        generateIndividualErrorMessage(
          "Could not find that profile, it may have already been deleted."
        )
      );
  }

  return res.status(200).json(deletedProfile);
}

module.exports = {
  createProfile,
  readProfile,
  readUserProfile,
  updateProfile,
  deleteProfile,
};
