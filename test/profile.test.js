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
  generateUserAndProfile,
  generateUserProfileObject,
  logInAndDelete,
  logUserIn,
  signUserUp,
} = require("./internalTestFunctions");

test("Create Profile route fails if req.body is blank", async () => {
  await request(app)
    .post("/profile")
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message:
            "There was a problem with the form data submitted; fill it out again and re-submit.",
        },
      ],
    })
    .expect(400);
});

test("Create Profile route fails without authHeader", async () => {
  await request(app)
    .post("/profile")
    .type("form")
    .send({ ourOnlyHope: "Obi-Wan Kenobi" })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "You must be logged in to do that." }],
    })
    .expect(401);
});

test("Create Profile route fails with corrupted authHeader", async () => {
  await request(app)
    .post("/profile")
    .set("Authorization", "Bearer broken_t0k3n")
    .type("form")
    .send({ doOrDoNot: "There is no try" })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Please sign in again and re-try that." }],
    })
    .expect(401);
});

test("Create Profile route fails if req.body.name is blank", async () => {
  const user = await generateSignedInUser();

  await request(app)
    .post("/profile")
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ name: "" })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Name must exist." }],
    })
    .expect(400);

  await deleteUser(user);
});

test("Create Profile route fails when website exists but is not a valid URL", async () => {
  const user = await generateSignedInUser();

  await request(app)
    .post("/profile")
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ name: "Godric Gryffindor", website: "not_a_w3b5ite" })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Website must be a valid URL." }],
    })
    .expect(400);

  await deleteUser(user);
});

test("Create Profile route succeeds when using a good authHeader and name, website and about can be blank", async () => {
  const user = await generateSignedInUser();
  const profile = generateUserProfileObject();

  const res = await request(app)
    .post("/profile")
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send(profile)
    .expect("Content-Type", /json/)
    .expect(200);

  const newProfile = res.body;

  expect(newProfile.id).toBeGreaterThan(0);
  expect(newProfile.userId).toBe(user.id);
  expect(newProfile.name).toBe(profile.name);
  expect(newProfile.website).toBe(profile.website);
  expect(newProfile.about).toBe("");

  await deleteUser(user);
});

/*
test("Read Profile route fails without authHeader", async () => {});

test("Read Profile route fails with corrupted authHeader", async () => {});

test("Read Profile fails with id for nonexistent profile", async () => {
  const { user, profile } = await generateUserAndProfile();

  await deleteUser(user);
});

test("Read Profile succeeds when using a good authHeader and valid id", async () => {
  const { user, profile } = await generateUserAndProfile();

  await deleteUser(user);
});

test("Update Profile route fails if req.body is blank", async () => {});

test("Update Profile route fails without authHeader", async () => {});

test("Update Profile route fails with corrupted authHeader", async () => {});

test("Update Profile route fails when trying to update another user's profile", async () => {
  const { userOne, profileOne } = await generateUserAndProfile();
  const { userTwo, profileTwo } = await generateUserAndProfile();

  console.log({ userOne, userTwo });

  await deleteUser(userOne);
  await deleteUser(userTwo);
});

test("Update Profile fails with id for nonexistent profile", async () => {
  const { user, profile } = await generateUserAndProfile();

  await deleteUser(user);
});

test("Update Profile route fails if req.body.name is blank", async () => {
  const { user, profile } = await generateUserAndProfile();

  await deleteUser(user);
});

test("Update Profile succeeds when using a good authHeader and valid id", async () => {
  const { user, profile } = await generateUserAndProfile();

  await deleteUser(user);
});

test("Delete Profile route fails without authHeader", async () => {});

test("Delete Profile route fails with corrupted authHeader", async () => {});

test("Delete Profile route fails when trying to delete another user's profile", async () => {
  const { userOne, profileOne } = await generateUserAndProfile();
  const { userTwo, profileTwo } = await generateUserAndProfile();

  console.log({ userOne, userTwo });

  await deleteUser(userOne);
  await deleteUser(userTwo);
});

test("Delete Profile fails with id for nonexistent profile", async () => {
  const { user, profile } = await generateUserAndProfile();

  await deleteUser(user);
});

test("Delete Profile succeeds when using a good authHeader and valid id", async () => {
  const { user, profile } = await generateUserAndProfile();

  await deleteUser(user);
});
*/
