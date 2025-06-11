/* to run only this test:
  clear & npx tsc & npx jest test/comment.test.js
*/

const router = require("../routes/router");

const request = require("supertest");
const express = require("express");
const app = express();
require("dotenv");

app.use(express.urlencoded({ extended: false }));
app.use("/", router);

const {
  generateUserAndProfile,
  generateUserProfilePost,
  deleteUser,
} = require("./internalTestFunctions");

let commentStart;

beforeEach(() => {
  commentStart = Date.now();
});

afterEach(() => {
  const duration = Date.now() - commentStart;
  const testName = expect.getState().currentTestName;
  if (duration >= 500) {
    console.log(`${testName} - ${duration} ms`);
  }
});

test("Create Comment On Post route fails if :postId is missing", async () => {});

test("Create Comment On Post route fails if req.body doesn't exist", async () => {});

test("Create Comment On Post route fails if req.body is empty", async () => {});

test("Create Comment On Post route fails if authHeader is missing", async () => {});

test("Create Comment On Post route fails if authHeader is corrupted", async () => {});

test("Create Comment On Post route fails if :postId is not a number", async () => {});

test("Create Comment On Post route fails if :postId is for a nonexistent post", async () => {});

test("Create Comment On Post route fails if req.body.text doesn't exist", async () => {});

test("Create Comment On Post route fails if req.body.text is empty", async () => {});

test("Create Comment On Post route fails if req.body.text is not a string", async () => {});

test("Create Comment On Post route succeeds with correct requirements", async () => {});

test("Get Comments On Post route fails if :postId is missing", async () => {});

test("Get Comments On Post route fails if authHeader is missing", async () => {});

test("Get Comments On Post route fails if authHeader is corrupted", async () => {});

test("Get Comments On Post route fails if :postId is not a number", async () => {});

test("Get Comments On Post route fails if :postId is for a nonexistent post", async () => {});

test("Get Comments On Post route succeeds with correct requirements", async () => {});

test("Create Comment Reply route fails if :commentId is missing", async () => {});

test("Create Comment Reply route fails if req.body doesn't exist", async () => {});

test("Create Comment Reply route fails if req.body is empty", async () => {});

test("Create Comment Reply route fails if authHeader is missing", async () => {});

test("Create Comment Reply route fails if authHeader is corrupted", async () => {});

test("Create Comment Reply route fails if :commentId is not a number", async () => {});

test("Create Comment Reply route fails if :commentId is for a nonexistent post", async () => {});

test("Create Comment Reply route fails if req.body.text doesn't exist", async () => {});

test("Create Comment Reply route fails if req.body.text is empty", async () => {});

test("Create Comment Reply route fails if req.body.text is not a string", async () => {});

test("Create Comment Reply route succeeds with correct requirements", async () => {});

test("Create Comment Reply route succeeds for a comment on a comment on a comment", async () => {});

test("Get Comment Replies route fails if :commentId is missing", async () => {});

test("Get Comment Replies route fails if authHeader is missing", async () => {});

test("Get Comment Replies route fails if authHeader is corrupted", async () => {});

test("Get Comment Replies route fails if :commentId is not a number", async () => {});

test("Get Comment Replies route fails if :commentId is for a nonexistent post", async () => {});

test("Get Comment Replies route succeeds with correct requirements", async () => {});

test("Get Comment Replies route succeeds for a comment on a comment on a comment", async () => {});

test("Update Comment route fails if :commentId is missing", async () => {});

test("Update Comment route fails if req.body doesn't exist", async () => {});

test("Update Comment route fails if req.body is empty", async () => {});

test("Update Comment route fails if authHeader is missing", async () => {});

test("Update Comment route fails if authHeader is corrupted", async () => {});

test("Update Comment route fails if user in authHeader isn't :commentId owner", async () => {});

test("Update Comment route fails if :commentId is not a number", async () => {});

test("Update Comment route fails if :commentId is for a nonexistent post", async () => {});

test("Update Comment route fails if req.body.newText doesn't exist", async () => {});

test("Update Comment route fails if req.body.newText is empty", async () => {});

test("Update Comment route fails if req.body.text is not a string", async () => {});

test("Update Comment route succeeds with correct requirements", async () => {});

test("Delete Comment route fails if :commentId is missing", async () => {});

test("Delete Comment route fails if authHeader is missing", async () => {});

test("Delete Comment route fails if authHeader is corrupted", async () => {});

test("Delete Comment route fails if user in authHeader isn't :commentId owner", async () => {});

test("Delete Comment route fails if :commentId is not a number", async () => {});

test("Delete Comment route fails if :commentId is for a nonexistent post", async () => {});

test("Delete Comment route succeeds with correct requirements", async () => {});
