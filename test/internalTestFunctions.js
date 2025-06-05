const router = require("../routes/router");

const request = require("supertest");
const express = require("express");
const app = express();
require("dotenv");
const { v4: uuidv4 } = require("uuid");

app.use(express.urlencoded({ extended: false }));
app.use("/", router);

function generateUserObject() {
  const email = `${uuidv4()}@email.com`;
  return {
    id: 0,
    email,
    password: "123456",
    confirmPassword: "123456",
    token: null,
  };
}

async function deleteUser(user) {
  await request(app)
    .delete(`/user/${user.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ password: user.password })
    .expect(200);
}

async function logUserIn(user) {
  const res = await request(app).post("/user/login").type("form").send(user);

  if (res.status !== 200) {
    console.log("log user in status not 200", res.body);
  }
  expect(res.body.id).toBeGreaterThan(0);
  expect(res.errors).not.toBeDefined();
  expect(200);

  user.id = res.body.id;
  user.token = res.body.token;
  return user;
}

async function signUserUp(user) {
  const res = await request(app).post("/user").type("form").send(user);

  if (res.status !== 200) {
    const existingUser = await logUserIn(user);
    return existingUser.id;
  }

  return res.body.id;
}

async function logInAndDelete(user) {
  const loggedInUser = await logUserIn(user);
  await deleteUser(loggedInUser);
}

async function generateSignedInUser() {
  const user = await generateUserObject();
  user.id = await signUserUp(user);
  const loggedInUser = logUserIn(user);
  return loggedInUser;
}

module.exports = {
  deleteUser,
  generateSignedInUser,
  generateUserObject,
  logInAndDelete,
  logUserIn,
  signUserUp,
};
