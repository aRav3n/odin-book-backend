const { validationResult } = require("express-validator");

const {
  createPostForProfile,
  readPostFromDatabase,
  updatePostText,
} = require("../db/queries");

const {
  generateErrorMessageFromArray,
  generateIndividualErrorMessage,
  validatePost,
} = require("./internalFunctions");
const { json } = require("stream/consumers");

const createPost = [
  validatePost,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorObject = generateErrorMessageFromArray(errors);
      return res.status(400).json(errorObject);
    }

    const profileId = Number(req.params.profileId);
    const post = await createPostForProfile(profileId, req.body.text);

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

async function deletePost(req, res) {
  const postId = Number(req.params.postId);
  return res.status(333).json({ message: "temp message" });
}

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

async function updatePost(req, res) {
  const text = req.body.text || null;
  if (!text || text.length === 0) {
    return res
      .status(400)
      .json(generateIndividualErrorMessage("Post text must be included"));
  }

  const postId = Number(req.params.postId);
  const post = await readPostFromDatabase(postId);
  if (!post) {
    return res
      .status(404)
      .json(
        generateIndividualErrorMessage(`No post with an id of ${id} found.`)
      );
  }

  const updatedPost = await updatePostText(postId, text);
  return res.status(200).json(updatedPost);
}

module.exports = { createPost, readPost, updatePost, deletePost };
