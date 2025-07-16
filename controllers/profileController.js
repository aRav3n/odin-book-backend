const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");

const {
  getUserEmail,
  addAnonProfile,
  addProfile,
  deleteUserProfile,
  getProfile,
  getProfileList,
  getUserProfile,
  updateExistingProfile,
} = require("../db/queries");
const {
  generateErrorMessageFromArray,
  generateIndividualErrorMessage,
  generateErrorRes,
  getGravatarUrl,
  validateProfile,
} = require("./internalFunctions");
const security = require("./securityController");

async function createAnonProfile(req, res) {
  const name = "Anonymous User";
  const website = "";
  const about =
    "This is an anonymous guest account that gets refreshed each time it's used.";
  const avatarUrl = "/anon_avatar.png";
  const email = "anon@user.co";

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync("password", salt);

  const { user, profile } = await addAnonProfile(
    name,
    about,
    website,
    avatarUrl,
    email,
    hash
  );

  if (!user || !profile) {
    return generateErrorRes(
      res,
      500,
      "There was an issue generating the anon account."
    );
  }

  const token = security.sign(user);
  user.token = token;

  return res.status(200).json({ user, profile });
}

const createProfile = [
  validateProfile,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorObject = generateErrorMessageFromArray(errors);
      return res.status(400).json(errorObject);
    }

    const userId = req.user.user.id;
    const existingProfile = await getUserProfile(userId);
    if (existingProfile) {
      return generateErrorRes(
        res,
        409,
        "A profile for this account already exists"
      );
    }

    const about = req.body.about || "";
    const website = req.body.website || "";

    const userEmail = await getUserEmail(userId);
    const avatarUrl =
      req.body.avatarUrl && req.body.avatarUrl.length > 0
        ? req.body.avatarUrl
        : getGravatarUrl(userEmail);

    const profile = await addProfile(
      userId,
      req.body.name,
      about,
      website,
      avatarUrl
    );

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
  const requestingUserId = req.user.user.id;
  const requestingProfile = await getUserProfile(requestingUserId);
  const requestingProfileId = requestingProfile.id;

  const profile = await getProfile(req.profileId, requestingProfileId);

  if (!profile) {
    return generateErrorRes(
      res,
      404,
      "Could not find that profile, please try again."
    );
  }

  return res.status(200).json(profile);
}

async function readProfileList(req, res) {
  let partialStringToMatch;
  if (!req.body || !req.body.stringToMatch) {
    partialStringToMatch = "";
  } else {
    partialStringToMatch = req.body.stringToMatch;
  }

  const profileList = await getProfileList(partialStringToMatch);

  if (!profileList || profileList.length === 0) {
    return generateErrorRes(res, 404, "Sorry, no matching profiles found!");
  }

  return res.status(200).json(profileList);
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
    const avatarUrl = req.body.avatarUrl || "";

    const updatedProfile = await updateExistingProfile(
      id,
      userId,
      name,
      website,
      about,
      avatarUrl
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
  createAnonProfile,
  createProfile,
  readProfile,
  readProfileList,
  readUserProfile,
  updateProfile,
  deleteProfile,
};
