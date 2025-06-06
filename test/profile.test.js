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

let profileStart;

beforeEach(() => {
  profileStart = Date.now();
});

afterEach(() => {
  const duration = Date.now() - profileStart;
  const testName = expect.getState().currentTestName;
  if (duration >= 500) {
    console.log(`${testName} - ${duration} ms`);
  }
});

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

test("Read Profile route fails without authHeader", async () => {
  const profileId = 0;
  await request(app)
    .get(`/profile/${profileId}`)
    .type("form")
    .send({ ourOnlyHope: "Obi-Wan Kenobi" })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "You must be logged in to do that." }],
    })
    .expect(401);
});

test("Read Profile route fails with corrupted authHeader", async () => {
  const profileId = 0;
  await request(app)
    .get(`/profile/${profileId}`)
    .set("Authorization", "Bearer broken_t0k3n")
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Please sign in again and re-try that." }],
    })
    .expect(401);
});

test("Read Profile fails with id for nonexistent profile", async () => {
  const { user, profile } = await generateUserAndProfile();

  const profileId = profile.id;
  await request(app)
    .get(`/profile/${profileId - 1}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Could not find that profile, please try again." }],
    })
    .expect(404);

  await deleteUser(user);
});

test("Read Profile succeeds when using a good authHeader and valid id", async () => {
  const { user, profile } = await generateUserAndProfile();

  const profileId = profile.id;
  await request(app)
    .get(`/profile/${profileId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      const body = res.body;
      expect(body.id).toBe(profile.id);
      expect(body.userId).toBe(user.id);
      expect(body.name).toBe(profile.name);
      expect(body.website).toBe(profile.website);
      expect(body.about).toBe(profile.about);
    });

  await deleteUser(user);
});

test("Update Profile route fails if req.body is blank", async () => {
  const profileId = 0;
  await request(app)
    .put(`/profile/${profileId}`)
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

test("Update Profile route fails without authHeader", async () => {
  const profileId = 0;
  await request(app)
    .put(`/profile/${profileId}`)
    .type("form")
    .send({ ourOnlyHope: "Obi-Wan Kenobi" })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "You must be logged in to do that." }],
    })
    .expect(401);
});

test("Update Profile route fails with corrupted authHeader", async () => {
  const profileId = 0;
  await request(app)
    .put(`/profile/${profileId}`)
    .type("form")
    .send({ chosenOne: "I'm coming!" })
    .set("Authorization", "Bearer broken_t0k3n")
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Please sign in again and re-try that." }],
    })
    .expect(401);
});

test("Update Profile route fails when trying to update another user's profile", async () => {
  const { user: userOne, profile: profileOne } = await generateUserAndProfile();
  const { user: userTwo, profile: profileTwo } = await generateUserAndProfile();

  await request(app)
    .put(`/profile/${profileTwo.id}`)
    .type("form")
    .send({ chosenOne: "I'm coming!" })
    .set("Authorization", `Bearer ${userOne.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message: "Access to that profile is not allowed from this account.",
        },
      ],
    })
    .expect(403);

  await deleteUser(userOne);
  await deleteUser(userTwo);
});

test("Update Profile fails with id for nonexistent profile", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .put(`/profile/${profile.id - 1}`)
    .type("form")
    .send({ niceShot: "Don't get cocky" })
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message: "Access to that profile is not allowed from this account.",
        },
      ],
    })
    .expect(403);

  await deleteUser(user);
});

test("Update Profile route fails if req.body.name is blank", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .put(`/profile/${profile.id}`)
    .type("form")
    .send({ niceShot: "Don't get cocky" })
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message: "The name field cannot be blank.",
        },
      ],
    })
    .expect(400);

  await deleteUser(user);
});

test("Update Profile succeeds when using a good authHeader and valid id", async () => {
  const { user, profile } = await generateUserAndProfile();
  const profileUpdate = {
    ...profile,
    name: "Parvati Patil",
    website: "https://harrypotter.fandom.com/wiki/Gryffindor",
  };

  await request(app)
    .put(`/profile/${profile.id}`)
    .type("form")
    .send(profileUpdate)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .then((res) => {
      const body = res.body;
      expect(body.id).toBe(profileUpdate.id);
      expect(body.userId).toBe(user.id);
      expect(body.name).toBe(profileUpdate.name);
      expect(body.name).not.toBe(profile.name);
      expect(body.website).toBe(profileUpdate.website);
      expect(body.website).not.toBe(profile.website);
      expect(body.about).toBe(profileUpdate.about);
      expect(200);
    });

  await deleteUser(user);
});

test("Delete Profile route fails without authHeader", async () => {
  const profileId = 0;
  await request(app)
    .delete(`/profile/${profileId}`)
    .type("form")
    .send({ secretToHappiness: "Appreciating the small things." })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "You must be logged in to do that." }],
    })
    .expect(401);
});

test("Delete Profile route fails with corrupted authHeader", async () => {
  const profileId = 0;
  await request(app)
    .delete(`/profile/${profileId}`)
    .set("Authorization", "Bearer broken_t0k3n")
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Please sign in again and re-try that." }],
    })
    .expect(401);
});

test("Delete Profile route fails when trying to delete another user's profile", async () => {
  const { user: userOne, profile: profileOne } = await generateUserAndProfile();
  const { user: userTwo, profile: profileTwo } = await generateUserAndProfile();

  await request(app)
    .delete(`/profile/${profileTwo.id}`)
    .set("Authorization", `Bearer ${userOne.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message: "Access to that profile is not allowed from this account.",
        },
      ],
    })
    .expect(403);

  await deleteUser(userOne);
  await deleteUser(userTwo);
});

test("Delete Profile fails with id for nonexistent profile", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .delete(`/profile/${profile.id - 1}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message: "Access to that profile is not allowed from this account.",
        },
      ],
    })
    .expect(403);

  await deleteUser(user);
});

test("Delete Profile fails if profile has already been delete", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .delete(`/profile/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect(200);

  await request(app)
    .delete(`/profile/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message: "Access to that profile is not allowed from this account.",
        },
      ],
    })
    .expect(403);

  await deleteUser(user);
});

test("Delete Profile succeeds when using a good authHeader and valid id", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .delete(`/profile/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      const body = res.body;
      expect(body.id).toBe(profile.id);
      expect(body.name).toBe(profile.name);
    });

  await deleteUser(user);
});
