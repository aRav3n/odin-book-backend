const { validationResult } = require("express-validator");

const {
  readPostFromDatabase,
  getProfile,
  createCommentOnPost,
  readCommentsOnPost,
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
    }

    // success returns 200 & { id, profile.name, text, replies, likes }
    return res.status(333).json({ message: "temp message" });
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

  // success returns 200 & { [ { profile.name, likes } ] }
  return res.status(333).json({ message: "temp message" });
}

async function updateComment(req, res) {
  // success returns 200 & { id, profile.name, text, likes, replies }
  return res.status(333).json({ message: "temp message" });
}

module.exports = { createComment, readComments, updateComment, deleteComment };
