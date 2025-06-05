const router = require("../routes/router");

const request = require("supertest");
const express = require("express");
const app = express();
require("dotenv");

app.use(express.urlencoded({ extended: false }));
app.use("/", router);

const {
  deleteUser,
  generateSignedInUser,
  generateUserObject,
  logInAndDelete,
  logUserIn,
  signUserUp,
} = require("./internalTestFunctions");

const userProfile = {
  id: null,
};

test("Create Profile route fails if req.body is blank", async () => {});

test("Create Profile route fails without authHeader", async () => {});

test("Create Profile route fails with corrupted authHeader", async () => {});

test("Create Profile route fails if req.body.name is blank", async () => {
  const user = await generateSignedInUser();
  await deleteUser(user);
});

test("Create Profile route succeeds when using a good authHeader and name", async () => {});

test("Read Profile route fails without authHeader", async () => {});

test("Read Profile route fails with corrupted authHeader", async () => {});

test("Read Profile fails with id for nonexistent profile", async () => {});

test("Read Profile succeeds when using a good authHeader and valid id", async () => {});

test("Update Profile route fails if req.body is blank", async () => {});

test("Update Profile route fails without authHeader", async () => {});

test("Update Profile route fails with corrupted authHeader", async () => {});

test("Update Profile route fails when trying to update another user's profile", async () => {});

test("Update Profile fails with id for nonexistent profile", async () => {});

test("Update Profile route fails if req.body.name is blank", async () => {});

test("Update Profile succeeds when using a good authHeader and valid id", async () => {});

test("Delete Profile route fails without authHeader", async () => {});

test("Delete Profile route fails with corrupted authHeader", async () => {});

test("Delete Profile route fails when trying to delete another user's profile", async () => {});

test("Delete Profile fails with id for nonexistent profile", async () => {});

test("Delete Profile succeeds when using a good authHeader and valid id", async () => {});
