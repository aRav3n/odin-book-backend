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

async function createComment(req, res) {
  const postId = Number(req.params.postId) || null;
  const commentId = Number(req.params.commentId) || null;

  if (!postId && !commentId) {
    return res.status 
  }

  // success returns 200 & { id, profile.name, text, replies, likes }
  return res.status(333).json({ message: "temp message" });
}

async function deleteComment(req, res) {
  // success returns 200 & { success: true }
  return res.status(333).json({ message: "temp message" });
}

async function readComments(req, res) {
  const postId = Number(req.params.postId) || null;
  const commentId = Number(req.params.commentId) || null;

  // success returns 200 & { [ { profile.name, likes } ] }
  return res.status(333).json({ message: "temp message" });
}

async function updateComment(req, res) {
  // success returns 200 & { id, profile.name, text, likes, replies }
  return res.status(333).json({ message: "temp message" });
}

module.exports = { createComment, readComments, updateComment, deleteComment };
