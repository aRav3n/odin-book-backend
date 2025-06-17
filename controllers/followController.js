const { validationResult } = require("express-validator");

const {
  createNewFollow,
  readFollowers,
  readFollowing,
  getProfile,
} = require("../db/queries");

const {
  generateErrorMessageFromArray,
  generateIndividualErrorMessage,
  validatePost,
} = require("./internalFunctions");

async function createFollow(req, res) {
  // followerId follows followingId
  const profileToFollow = await getProfile(req.followingId);
  if (!profileToFollow) {
    return res
      .status(404)
      .json(
        generateIndividualErrorMessage(
          "Unable to find the profile you are attempting to follow."
        )
      );
  }

  const follow = await createNewFollow(req.followerId, req.followingId);
  if (!follow) {
    return res
      .status(500)
      .json(
        generateIndividualErrorMessage(
          "There was an error following that profile, please try again."
        )
      );
  }

  return res.status(200).json(follow);
}

async function readProfileFollowers(req, res) {
  const followersArray = await readFollowers(req.profileId);
  if (!followersArray) {
    return res
      .status(404)
      .json(generateIndividualErrorMessage("Unable to find that profile."));
  }

  return res.status(200).json(followersArray);
}

async function readProfileFollowing(req, res) {
  const followingArray = await readFollowing(req.profileId);
  if (!followingArray) {
    return res
      .status(404)
      .json(generateIndividualErrorMessage("Unable to find that profile."));
  }

  return res.status(200).json(followingArray);
}

const updateFollow = [, async (req, res) => {}];

async function deleteFollow(req, res) {}

module.exports = {
  createFollow,
  readProfileFollowers,
  readProfileFollowing,
  updateFollow,
  deleteFollow,
};
