/* to run only this test:
  clear & npx tsc & npx jest test/post.test.js
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

test("Create Post route fails if :profileId is missing", async () => {
  await request(app)
    .post("/post")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Create Post route fails if req.body is empty", async () => {
  await request(app)
    .post("/post/1")
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
    .post("/post/1")
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
    .post("/post/1")
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

test("Create Post route fails if :profileId is not a number", async () => {
  const { user, profile } = await generateUserAndProfile();
  await request(app)
    .post("/post/xyz")
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ doesSizeMatterAccordingToYoda: false })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "No valid req.params were found." }] })
    .expect(400);

  deleteUser(user);
});

test("Create Post route fails if the profile with profileId doesn't belong to the user with the authHeader", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .post(`/post/${profile.id - 1000}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({
      profileId: 1,
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
    .post(`/post/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({ soCute: "Bye bye" })
    .expect({
      errors: [{ message: "Post text must be included" }],
    })
    .expect(400);

  deleteUser(user);
});

test("Create Post route fails if text blank", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .post(`/post/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({ text: "" })
    .expect({ errors: [{ message: "Post text must be included" }] })
    .expect(400);

  deleteUser(user);
});

test("Create Post route succeeds if all required info is correct", async () => {
  const { user, profile } = await generateUserAndProfile();
  const text = "Do, or do not, there is no try.";

  await request(app)
    .post(`/post/${profile.id}`)
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

test("Read Post route fails with missing authHeader", async () => {
  await request(app)
    .get("/post/0")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Read Post route fails with corrupted authHeader", async () => {
  await request(app)
    .get("/post/0")
    .set("Authorization", "Bearer c0rrupt3d_4uth_h3ad3r")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Read Post route fails if postId is missing", async () => {
  await request(app)
    .get("/post/")
    .set("Authorization", "Bearer bad_token")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Read Post route fails if postId is not a number", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .get("/post/notANumber")
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "postId must be a number" }] })
    .expect(400);

  deleteUser(user);
});

test("Read Post route fails if a post with the id of postId doesn't exist", async () => {
  const { user, profile } = await generateUserAndProfile();

  const res = await request(app)
    .get("/post/0")
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "No post with an id of 0 found." }] })
    .expect(404);

  deleteUser(user);
});

test("Read Post route succeeds with good authHeader and correct postId", async () => {
  const { user, profile, post } = await generateUserProfilePost();

  await request(app)
    .get(`/post/${post.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect(post)
    .expect(200);

  deleteUser(user);
});

test("Update Post route fails if req.body is blank", async () => {
  await request(app)
    .put("/post/0")
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

test("Update Post route fails with missing authHeader", async () => {
  await request(app)
    .put("/post/0")
    .type("form")
    .send({ soCute: "Bye bye" })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Update Post route fails with corrupted authHeader", async () => {
  await request(app)
    .put("/post/0")
    .set("Authorization", "Bearer c0rrupt3d_4uth_h3ad3r")
    .type("form")
    .send({ soCute: "Bye bye" })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Update Post route fails if postId is missing", async () => {
  await request(app)
    .put("/post/")
    .set("Authorization", "Bearer bad_token")
    .type("form")
    .send({ soCute: "Bye bye" })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Update Post route fails if postId is not a number", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .put("/post/notANumber")
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ soCute: "Bye bye" })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "No valid req.params were found." }],
    })
    .expect(400);

  deleteUser(user);
});

test("Update Post route fails if a post with the id of postId doesn't exist", async () => {
  const { user, profile } = await generateUserAndProfile();
  const postId = 1;

  const res = await request(app)
    .put(`/post/${postId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ soCute: "Bye bye" })
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        { message: "Access to that post is not allowed from this account." },
      ],
    })
    .expect(403);

  deleteUser(user);
});

test("Update Post route fails if text nonexistent", async () => {
  const { user, profile, post } = await generateUserProfilePost();

  await request(app)
    .put(`/post/${post.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({ soCute: "Bye bye" })
    .expect({
      errors: [{ message: "Post text must be included" }],
    })
    .expect(400);

  deleteUser(user);
});

test("Update Post route fails if text blank", async () => {
  const { user, profile, post } = await generateUserProfilePost();

  await request(app)
    .put(`/post/${post.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({ profileId: profile.id, text: "" })
    .expect({ errors: [{ message: "Post text must be included" }] })
    .expect(400);

  deleteUser(user);
});

test("Update Post route succeeds with good authHeader and correct postId", async () => {
  const { user, profile, post } = await generateUserProfilePost();
  const text = "Updated text";

  const res = await request(app)
    .put(`/post/${post.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ text })
    .expect("Content-Type", /json/)
    .expect({ ...post, text })
    .expect(200);

  const updatedPost = res.body;

  await request(app)
    .get(`/post/${post.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect(updatedPost)
    .expect(200);

  deleteUser(user);
});

test("Delete Post route fails without authHeader", async () => {
  await request(app)
    .delete("/post/1")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Delete Post route fails with corrupted authHeader", async () => {
  const badAuthHeader = "n0t_an_auth_header";

  await request(app)
    .delete("/post/1")
    .set("Authorization", `Bearer ${badAuthHeader}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Delete Post route fails if :postId is not a number", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .delete("/post/xyz")
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "No valid req.params were found." }] })
    .expect(400);

  deleteUser(user);
});

test("Delete Post route fails :postId is nonexistent", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .delete("/post/")
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);

  deleteUser(user);
});

test("Delete Post route fails if authHeader doesn't match post owner", async () => {
  const {
    user: userOne,
    profile: profileOne,
    post: postOne,
  } = await generateUserProfilePost();
  const {
    user: userTwo,
    profile: profileTwo,
    post: postTwo,
  } = await generateUserAndProfile();

  await request(app)
    .delete(`/post/${postOne.id}`)
    .set("Authorization", `Bearer ${userTwo.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message: "Access to that post is not allowed from this account.",
        },
      ],
    })
    .expect(403);

  deleteUser(userOne);
  deleteUser(userTwo);
});

test("Delete Post route succeeds if authHeader matches :postId owner", async () => {
  const { user, profile, post } = await generateUserProfilePost();

  await request(app)
    .delete(`/post/${post.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({ success: true })
    .expect(200);

  deleteUser(user);
});
