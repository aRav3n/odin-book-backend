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

async function createLikeOnComment(req, res) {}

async function createLikeOnPost(req, res) {}

async function deleteLike(req, res) {}

module.exports = { createLikeOnComment, createLikeOnPost, deleteLike };
