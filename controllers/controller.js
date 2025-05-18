// const db = require("../db/queries");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const passport = require("passport");
require("dotenv").config();

const alphaErr = "must only contain letters";
const nameLengthErr = "must be between 1 and 10 characters";
const emailErr = "must be a valid email";

const validateUser = [
  body("firstname")
    .trim()
    .isAlpha()
    .withMessage(`First name alphaErr`)
    .isLength({ min: 1, max: 10 })
    .withMessage(`First name nameLengthErr`),
  body("lastname")
    .trim()
    .isAlpha()
    .withMessage(`Last name alphaErr`)
    .isLength({ min: 1, max: 10 })
    .withMessage(`Last name nameLengthErr`),
  body("username")
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage(`User name nameLengthErr`),
  body("email").trim().isEmail().withMessage(`email emailErr`),
  body("password")
    .trim()
    .isLength({ min: 6, max: 16 })
    .withMessage("Password must be between 6 and 16 characters"),
  body("confirmPassword")
    .exists()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        return false;
      }
      return true;
    })
    .withMessage("Passwords must match")
    .trim(),
];

const validatePost = [
  body("title")
    .trim()
    .isAlphanumeric()
    .isLength({min: 1})
    .withMessage("You need to have a title"),
  body("body")
    .trim()
    .isAlphanumeric()
];

function formatDate() {
  const date = new Date();

  const formattedDate = date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return formattedDate;
}

async function indexGet(req, res) {
  console.log("user:", req.user, "session:", req.session);
  res.render("index", {
    title: "Users",
  });
}

/*
async function newActionGet(req, res) {
  res.render("new", {
    title: "New Page",
  });
}

newActionPost = [
  validateUser,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("createUser", {
        title: "Create user",
        errors: errors.array(),
      });
    }
    const { userName } = req.body;
    await db.insertUsername(userName);
    res.redirect("/");
  },
];

async function searchActionGet(req, res) {
  const { searchString } = req.query;
  const searchResults = await db.searchUsers(searchString);
  res.render("search", {
    title: "Search Results",
    searchResults: searchResults,
  });
}
*/

module.exports = {
  indexGet,
};
