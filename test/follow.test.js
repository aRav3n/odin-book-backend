/* to run only this test:
  clear & npx tsc & npx jest test/follow.test.js
*/

const router = require("../routes/router");

const request = require("supertest");
const express = require("express");
const app = express();
require("dotenv");

app.use(express.urlencoded({ extended: false }));
app.use("/", router);

const {
  generateCommentAndParents,
  generateUserAndProfile,
  generateUserProfilePost,
  deleteUser,
} = require("./internalTestFunctions");

let followStart;

beforeEach(() => {
  followStart = Date.now();
});

afterEach(() => {
  const duration = Date.now() - followStart;
  const testName = expect.getState().currentTestName;
  if (duration >= 500) {
    console.log(`${testName} - ${duration} ms`);
  }
});

test("Create Follow route fails if profileId is missing", async () => {});

test("Create Follow route fails if followerId is missing", async () => {});

test("Create Follow route fails if profileId isn't a number", async () => {});

test("Create Follow route fails if followerId isn't a number", async () => {});

test("Create Follow route fails if authHeader is missing", async () => {});

test("Create Follow route fails if authHeader is corrupted", async () => {});

test("Create Follow route fails if authHeader user's profileId !== followerId", async () => {});

test("Create Follow route fails if profileId is for a nonexistent profile", async () => {});

test("Create Follow route succeeds if all information provided is correct", async () => {});

/*
test("Read Followers route fails if profileId is missing", async () => {});

test("Read Followers route fails if profileId isn't a number", async () => {});

test("Read Followers route fails if authHeader is missing", async () => {});

test("Read Followers route fails if authHeader is corrupted", async () => {});

test("Read Followers route fails if profileId is for a nonexistent profile", async () => {});

test("Read Followers route succeeds if all provided information is correct", async () => {});

test("Read Following route fails if profileId is missing", async () => {});

test("Read Following route fails if profileId isn't a number", async () => {});

test("Read Following route fails if authHeader is missing", async () => {});

test("Read Following route fails if authHeader is corrupted", async () => {});

test("Read Following route fails if profileId is for a nonexistent profile", async () => {});

test("Read Following route succeeds if all provided information is correct", async () => {});

test("Update Follow route fails if followId is missing", async () => {});

test("Update Follow route fails if followId isn't a number", async () => {});

test("Update Follow route fails if authHeader is missing", async () => {});

test("Update Follow route fails if authHeader is corrupted", async () => {});

test("Update Follow route fails if followId is for a nonexistent follow", async () => {});

test("Update Follow route fails if authHeader user.id isn't followingId", async () => {});

test("Update Follow route succeeds if all information provided is correct", async () => {});

test("Delete Follow route fails if followId is missing", async () => {});

test("Delete Follow route fails if followId isn't a number", async () => {});

test("Delete Follow route fails if authHeader is missing", async () => {});

test("Delete Follow route fails if authHeader is corrupted", async () => {});

test("Delete Follow route fails if followId is for a nonexistent follow", async () => {});

test("Delete Follow route fails if authHeader user.id isn't follow.followingId or follow.followerId", async () => {});

test("Delete Follow route succeeds if all information provided is correct", async () => {});
*/
