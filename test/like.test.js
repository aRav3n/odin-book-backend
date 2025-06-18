// to run only this test:   clear & npx jest test/like.test.js

const router = require("../routes/router");

const request = require("supertest");
const express = require("express");
const app = express();
require("dotenv");

app.use(express.urlencoded({ extended: false }));
app.use("/", router);

const {
  deleteEveryone,
  generateUserAndProfile,
  deleteUser,
} = require("./internalTestFunctions");

let likeStart;

beforeEach(() => {
  likeStart = Date.now();
});

afterEach(() => {
  const duration = Date.now() - likeStart;
  const testName = expect.getState().currentTestName;
  if (duration >= 500) {
    console.log(`${testName} - ${duration} ms`);
  }
});

afterAll(async () => {
  // const deleted = await deleteEveryone();
  // console.log(deleted);
});

// comment like creation tests
test("Create Like On Comment route fails if likeCommentId is missing", async () => {});

test("Create Like On Comment route fails if profileId is missing", async () => {});

test("Create Like On Comment route fails if likeCommentId is not a number", async () => {});

test("Create Like On Comment route fails if profileId is not a number", async () => {});

test("Create Like On Comment route fails if authHeader is missing", async () => {});

test("Create Like On Comment route fails if authHeader is corrupted", async () => {});

test("Create Like On Comment route fails if authHeader isn't for owner of profileId", async () => {});

test("Create Like On Comment route fails if likeCommentId is for a nonexistent comment", async () => {});

test("Create Like On Comment route succeeds if all provided info is correct", async () => {});

// post like creation tests
test("Create Like On Post route fails if likePostId is missing", async () => {});

test("Create Like On Post route fails if profileId is missing", async () => {});

test("Create Like On Post route fails if likePostId is not a number", async () => {});

test("Create Like On Post route fails if profileId is not a number", async () => {});

test("Create Like On Post route fails if authHeader is missing", async () => {});

test("Create Like On Post route fails if authHeader is corrupted", async () => {});

test("Create Like On Post route fails if authHeader isn't for owner of profileId", async () => {});

test("Create Like On Post route fails if likePostId is for a nonexistent post", async () => {});

test("Create Like On Post route succeeds if all provided info is correct", async () => {});

// like deletion tests
test("Delete Like route fails if likeId is missing", async () => {});

test("Delete Like route fails if likeId is not a number", async () => {});

test("Delete Like route fails if authHeader is missing", async () => {});

test("Delete Like route fails if authHeader is corrupted", async () => {});

test("Delete Like route fails if authHeader isn't for owner of like", async () => {});

test("Delete Like route succeeds if all provided info is correct", async () => {});
