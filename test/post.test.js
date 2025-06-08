const router = require("../routes/router");

const request = require("supertest");
const express = require("express");
const app = express();
require("dotenv");

app.use(express.urlencoded({ extended: false }));
app.use("/", router);

const {
  generateUserAndProfile,
  deleteUser,
} = require("./internalTestFunctions");

let postStart;

beforeEach(() => {
  postStart = Date.now();
});

afterEach(() => {
  const duration = Date.now() - postStart;
  const testName = expect.getState().currentTestName;
  if (duration >= 500) {
    console.log(`${testName} - ${duration} ms`);
  }
});

test("Create Post route fails if req.body is empty", async () => {
  await request(app)
    .post("/post")
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

test("Create Post route fails if authHeader doesn't exist", async () => {
  await request(app)
    .post("/post")
    .expect("Content-Type", /json/)
    .type("form")
    .send({ whoIsBack: "Backstreet" })
    .expect({
      errors: [
        {
          message: "You must be logged in to do that.",
        },
      ],
    })
    .expect(401);
});

test("Create Post route fails if authHeader is corrupted or modified", async () => {
  await request(app)
    .post("/post")
    .set("Authorization", "Bearer broken_t0k3n")
    .expect("Content-Type", /json/)
    .type("form")
    .send({ howDoIWantIt: "That way" })
    .expect({
      errors: [
        {
          message: "Please sign in again and re-try that.",
        },
      ],
    })
    .expect(401);
});

test("Create Post route fails if the profile with profileId doesn't belong to the user with the authHeader", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .post("/post")
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({
      profileId: profile.id - 1,
      text: "Help me Obi-Wan, you're my only hope.",
    })
    .expect({
      errors: [
        {
          message: "Access to that profile is not allowed from this account.",
        },
      ],
    })
    .expect(403);

  deleteUser(user);
});

test("Create Post route fails if text nonexistent", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .post("/post")
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({ soCute: "Bye bye" })
    .expect({
      errors: [
        { message: "No valid req.params or profileId items were found." },
      ],
    })
    .expect(400);

  deleteUser(user);
});

test("Create Post route fails if text blank", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .post("/post")
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({ profileId: profile.id, text: "" })
    .expect({ errors: [{ message: "Post text must be included" }] })
    .expect(400);

  deleteUser(user);
});

test("Create Post route succeeds if all required info is correct", async () => {
  const { user, profile } = await generateUserAndProfile();
  const text = "Do, or do not, there is no try.";

  await request(app)
    .post("/post")
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({
      profileId: profile.id,
      text,
    })
    .then((res) => {
      expect(res.body.id).toBeDefined;
      expect(res.body.text).toBe(text);
      expect(res.body.profileId).toBe(profile.id);
      expect(200);
    });

  deleteUser(user);
});
