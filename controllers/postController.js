const { validationResult } = require("express-validator");

const { createPostForProfile, readPostFromDatabase } = require("../db/queries");

const {
  generateErrorMessageFromArray,
  generateIndividualErrorMessage,
  validatePost,
} = require("./internalFunctions");

const createPost = [
  validatePost,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorObject = generateErrorMessageFromArray(errors);
      return res.status(400).json(errorObject);
    }

    const post = await createPostForProfile(
      Number(req.body.profileId),
      req.body.text
    );

    if (!post) {
      return res
        .status(500)
        .json(
          generateIndividualErrorMessage(
            "Something went wrong when trying to create that post. Please try again."
          )
        );
    }

    return res.status(200).json(post);
  },
];

async function deletePost(req, res) {}

async function readPost(req, res) {
  const id = Number(req.params.postId);
  if (isNaN(id)) {
    return res
      .status(400)
      .json(generateIndividualErrorMessage("postId must be a number"));
  }

  const post = await readPostFromDatabase(id);
  if (!post) {
    return res
      .status(404)
      .json(
        generateIndividualErrorMessage(`No post with an id of ${id} found.`)
      );
  }

  return res.status(200).json(post);
}

async function updatePost(req, res) {}

module.exports = { createPost, readPost, updatePost, deletePost };
