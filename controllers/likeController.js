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
  const like = await createLikeComment(req.likeCommentId, req.profileId);
  if (like === false) {
    return res
      .status(404)
      .json(generateIndividualErrorMessage("That comment was not found."));
  } else if (!like) {
    return res
      .status(500)
      .json(generateIndividualErrorMessage("Server error, please try again."));
  }
  return res.status(200).json(like);
}

async function createLikeOnPost(req, res) {
  const like = await createLikePost(req.likePostId, req.profileId);

  if (like === false) {
    return res
      .status(404)
      .json(generateIndividualErrorMessage("That post was not found."));
  } else if (!like) {
    return res
      .status(500)
      .json(generateIndividualErrorMessage("Server error, please try again."));
  }

  return res.status(200).json(like);
}

async function deleteLike(req, res) {
  return res.status(333).json({});
}

module.exports = { createLikeOnComment, createLikeOnPost, deleteLike };
