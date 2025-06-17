const { validationResult } = require("express-validator");

const {
  createNewFollow,
  readFollowers,
  readPostFromDatabase,
  getProfile,
  createCommentReply,
  createCommentOnPost,
  readCommentReplies,
  readCommentsOnPost,
  readSingleComment,
  updateCommentInDatabase,
  deleteCommentFromDatabase,
} = require("../db/queries");

const {
  generateErrorMessageFromArray,
  generateIndividualErrorMessage,
  validatePost,
} = require("./internalFunctions");

async function createFollow(req, res) {
  // followerId follows profileId
  const profileToFollow = await getProfile(req.profileId);
  if (!profileToFollow) {
    return res
      .status(404)
      .json(
        generateIndividualErrorMessage(
          "Unable to find the profile you are attempting to follow."
        )
      );
  }

  const follow = await createNewFollow(req.followerId, profileToFollow.id);
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
  const profileAndFollowers = await readFollowers(req.profileId);
  if (!profileAndFollowers) {
    return res
      .status(404)
      .json(generateIndividualErrorMessage("Unable to find that profile."));
  }

  return res.status(200).json(profileAndFollowers.followers);
}

async function readProfileFollowing(req, res) {}

const updateFollow = [, async (req, res) => {}];

async function deleteFollow(req, res) {}

module.exports = {
  createFollow,
  readProfileFollowers,
  readProfileFollowing,
  updateFollow,
  deleteFollow,
};
