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
  deleteCommentFromDatabase,
} = require("../db/queries");

const {
  generateErrorMessageFromArray,
  generateIndividualErrorMessage,
  validatePost,
} = require("./internalFunctions");

const createFollow = [, async (req, res) => {}];

async function readProfileFollowers(req, res) {}

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
