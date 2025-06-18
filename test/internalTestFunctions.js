const router = require("../routes/router");

const request = require("supertest");
const express = require("express");
const app = express();
require("dotenv");
const { v4: uuidv4 } = require("uuid");

app.use(express.urlencoded({ extended: false }));
app.use("/", router);

const { deleteAllUsers, deleteSingleUser } = require("../db/queries");

async function deleteEveryone() {
  const deleted = await deleteAllUsers();
  return deleted;
}

async function deleteUser(user) {
  await deleteSingleUser(user.id);
}

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

function generateUserProfileObject(customName) {
  const userId = null;
  const name = customName || "Padma Patil";
  const website = "https://harrypotter.fandom.com/wiki/Ravenclaw";
  const about = "";

  return { userId, name, website, about };
}

async function generateSignedInUser() {
  const user = generateUserObject();
  user.id = await signUserUp(user);
  const loggedInUser = logUserIn(user);
  return loggedInUser;
}

async function generateUserAndProfile(customName) {
  const user = await generateSignedInUser();
  const profile = generateUserProfileObject(customName);

  const res = await request(app)
    .post("/profile")
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send(profile)
    .expect(200);

  const newProfile = res.body;
  return { user, profile: newProfile };
}

async function generateUserProfilePost(customName) {
  const { user, profile } = await generateUserAndProfile(customName);

  const text =
    "You're going to form a new squadron? Just like that? Wave your hand and it appears? Well, I thought I'd tell High Command so they'll know what they need to give me. ―Wes Janson and Wedge Antilles";

  const res = await request(app)
    .post(`/post/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({
      profileId: profile.id,
      text,
    })
    .expect(200);

  const post = res.body;

  return { user, profile, post };
}

async function generateCommentAndParents(customName) {
  const { user, profile, post } = await generateUserProfilePost(customName);
  const text = "You're not really the Dragon Reborn.";

  const res = await request(app)
    .post(`/comment/post/${post.id}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ text })
    .expect(200);

  const comment = res.body;

  return { user, profile, post, comment };
}

async function generateJamesFollowingLilly() {
  const { user: lillyAccount, profile: lillyProfile } =
    await generateUserAndProfile("Lilly Evans");
  const { user: jamesAccount, profile: jamesProfile } =
    await generateUserAndProfile("James Potter");

  const res = await request(app)
    .post(`/follow/${lillyProfile.id}/from/${jamesProfile.id}`)
    .set("Authorization", `Bearer ${jamesAccount.token}`)
    .expect("Content-Type", /json/)
    .expect(200);

  const follow = res.body;

  return { lillyAccount, lillyProfile, jamesAccount, jamesProfile, follow };
}

module.exports = {
  deleteEveryone,
  deleteUser,
  generateCommentAndParents,
  generateJamesFollowingLilly,
  generateSignedInUser,
  generateUserAndProfile,
  generateUserProfileObject,
  generateUserProfilePost,
  generateUserObject,
  logInAndDelete,
  logUserIn,
  signUserUp,
};
