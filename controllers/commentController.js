const { validationResult } = require("express-validator");

const {
  readPostFromDatabase,
  getProfile,
  createCommentReply,
  createCommentOnPost,
  readCommentReplies,
  readCommentsOnPost,
  readSingleComment,
  updateCommentInDatabase,
} = require("../db/queries");

const {
  generateErrorMessageFromArray,
  generateIndividualErrorMessage,
  validatePost,
} = require("./internalFunctions");

const createComment = [
  validatePost,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorObject = generateErrorMessageFromArray(errors);
      return res.status(400).json(errorObject);
    }

    const profileId = req.profileId || null;
    if (!profileId) {
      return res
        .status(400)
        .json(generateIndividualErrorMessage("Profile ID is needed."));
    }

    const profile = await getProfile(profileId);
    if (!profile) {
      return res
        .status(404)
        .json(
          generateIndividualErrorMessage(
            `A profile with an id of ${profileId} was not found.`
          )
        );
    }

    if (req.postId) {
      const post = await readPostFromDatabase(req.postId);
      if (!post) {
        return res
          .status(404)
          .json(
            generateIndividualErrorMessage(
              `A post with the id of ${req.postId} was not found.`
            )
          );
      }
      const comment = await createCommentOnPost(
        req.postId,
        profileId,
        req.body.text
      );
      if (!comment) {
        return res
          .status(500)
          .json(
            generateIndividualErrorMessage(
              "There was an error saving that comment, please try again."
            )
          );
      }

      return res.status(200).json(comment);
    } else if (req.commentId) {
      const parentComment = await readSingleComment(req.commentId);
      if (!parentComment) {
        return res
          .status(404)
          .json(
            generateIndividualErrorMessage(
              `A comment with an id of ${req.commentId} was not found.`
            )
          );
      }

      const comment = await createCommentReply(
        req.commentId,
        req.body.text,
        profileId
      );

      if (!comment) {
        return res
          .status(500)
          .json(
            generateIndividualErrorMessage(
              "There was an issue with creating your comment, please try again."
            )
          );
      }

      return res.status(200).json(comment);
    }

    // success returns 200 & { id, profile.name, text, replies, likes }
    return res
      .status(500)
      .json(
        generateIndividualErrorMessage(
          "There was an error with commentController.createComment()"
        )
      );
  },
];

async function deleteComment(req, res) {
  // success returns 200 & { success: true }
  return res.status(333).json({ message: "temp message" });
}

async function readComments(req, res) {
  const postId = req.postId || null;
  const commentId = req.commentId || null;

  if (postId) {
    const post = await readPostFromDatabase(postId);
    if (!post) {
      return res
        .status(404)
        .json(
          generateIndividualErrorMessage(
            "That post was not found in the database."
          )
        );
    }

    const comments = await readCommentsOnPost(postId);
    return res.status(200).json(comments);
  }

  const comment = await readSingleComment(commentId);
  if (!comment) {
    return res
      .status(404)
      .json(
        generateIndividualErrorMessage(
          "That comment was not found in the database."
        )
      );
  }

  const replies = await readCommentReplies(commentId);

  return res.status(200).json(replies);
}

const updateComment = [
  validatePost,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorObject = generateErrorMessageFromArray(errors);
      return res.status(400).json(errorObject);
    }

    // existence of the comment is already verified in securityController.verifyTokenMatch => queries.checkOwnership

    const commentWithUpdates = await updateCommentInDatabase(
      req.commentId,
      req.body.text
    );

    if (!commentWithUpdates) {
      return res
        .status(500)
        .json(
          generateIndividualErrorMessage(
            "There was an error updating that comment, please try again."
          )
        );
    }

    return res.status(200).json(commentWithUpdates);
  },
];

module.exports = { createComment, readComments, updateComment, deleteComment };
