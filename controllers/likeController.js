const {
  createLikeComment,
  createLikePost,
  deleteLikeFromDatabase,
} = require("../db/queries");

const {
  generateErrorMessageFromArray,
  generateIndividualErrorMessage,
  validateFollow,
} = require("./internalFunctions");

async function createLikeOnComment(req, res) {
  const comment = await createLikeComment(req.likeCommentId, req.profileId);
  if (comment === false) {
    return res
      .status(404)
      .json(generateIndividualErrorMessage("That comment was not found."));
  } else if (!comment) {
    return res
      .status(500)
      .json(generateIndividualErrorMessage("Server error, please try again."));
  }
  return res.status(200).json(comment);
}

async function createLikeOnPost(req, res) {
  return res.status(333).json({});
}

async function deleteLike(req, res) {
  return res.status(333).json({});
}

module.exports = { createLikeOnComment, createLikeOnPost, deleteLike };
