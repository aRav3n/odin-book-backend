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
  generateCommentAndParents,
  generateUserProfilePost,
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

/*
afterAll(async () => {
  const deleted = await deleteEveryone();
  console.log(deleted);
});
*/

// comment like creation tests
test("Create Like On Comment route fails if likeCommentId is missing", async () => {
  const token = "notAToken";
  const likeCommentId = "";
  const profileId = "xyz";

  await request(app)
    .post(`/like/comment/${likeCommentId}/from/${profileId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Create Like On Comment route fails if profileId is missing", async () => {
  const token = "notAToken";
  const likeCommentId = "xyz";
  const profileId = "";

  await request(app)
    .post(`/like/comment/${likeCommentId}/from/${profileId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Create Like On Comment route fails if likeCommentId is not a number", async () => {
  const token = "notAToken";
  const likeCommentId = "xyz";
  const profileId = -1;

  await request(app)
    .post(`/like/comment/${likeCommentId}/from/${profileId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "The param likeCommentId must be a number." }],
    })
    .expect(400);
});

test("Create Like On Comment route fails if profileId is not a number", async () => {
  const token = "notAToken";
  const likeCommentId = -1;
  const profileId = "xyz";

  await request(app)
    .post(`/like/comment/${likeCommentId}/from/${profileId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "The param profileId must be a number." }] })
    .expect(400);
});

test("Create Like On Comment route fails if authHeader is missing", async () => {
  const likeCommentId = -1;
  const profileId = -1;

  await request(app)
    .post(`/like/comment/${likeCommentId}/from/${profileId}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Create Like On Comment route fails if authHeader is corrupted", async () => {
  const token = "notAToken";
  const likeCommentId = -1;
  const profileId = -1;

  await request(app)
    .post(`/like/comment/${likeCommentId}/from/${profileId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Create Like On Comment route fails if authHeader isn't for owner of profileId", async () => {
  const { user: siriusAccount, comment } =
    await generateCommentAndParents("Sirius Black");
  const { user: lupinAccount, profile: lupinProfile } =
    await generateUserAndProfile("Remus Lupin");

  await request(app)
    .post(`/like/comment/${comment.id}/from/${lupinProfile.id}`)
    .set("Authorization", `Bearer ${siriusAccount.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Access to that is not allowed from this account." }],
    })
    .expect(403);

  await deleteUser(siriusAccount);
  await deleteUser(lupinAccount);
});

test("Create Like On Comment route fails if likeCommentId is for a nonexistent comment", async () => {
  const { user: siriusAccount, comment } =
    await generateCommentAndParents("Sirius Black");
  const { user: lupinAccount, profile: lupinProfile } =
    await generateUserAndProfile("Remus Lupin");

  await request(app)
    .post(`/like/comment/${comment.id - 1000}/from/${lupinProfile.id}`)
    .set("Authorization", `Bearer ${lupinAccount.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "That comment was not found." }],
    })
    .expect(404);

  await deleteUser(siriusAccount);
  await deleteUser(lupinAccount);
});

test("Create Like On Comment route succeeds if all provided info is correct", async () => {
  const { user: siriusAccount, comment } =
    await generateCommentAndParents("Sirius Black");
  const { user: lupinAccount, profile: lupinProfile } =
    await generateUserAndProfile("Remus Lupin");

  await request(app)
    .post(`/like/comment/${comment.id}/from/${lupinProfile.id}`)
    .set("Authorization", `Bearer ${lupinAccount.token}`)
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      expect(res.body.id).toBeGreaterThan(0);
      expect(res.body.profileId).toBe(lupinProfile.id);
      expect(res.body.postId).toBe(null);
      expect(res.body.commentId).toBe(comment.id);
    });

  await deleteUser(siriusAccount);
  await deleteUser(lupinAccount);
});

// post like creation tests
test("Create Like On Post route fails if likePostId is missing", async () => {
  const token = "notAToken";
  const likePostId = "";
  const profileId = "xyz";

  await request(app)
    .post(`/like/post/${likePostId}/from/${profileId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Create Like On Post route fails if profileId is missing", async () => {
  const token = "notAToken";
  const likePostId = "xyz";
  const profileId = "";

  await request(app)
    .post(`/like/post/${likePostId}/from/${profileId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Create Like On Post route fails if likePostId is not a number", async () => {
  const token = "notAToken";
  const likePostId = "xyz";
  const profileId = -1;

  await request(app)
    .post(`/like/post/${likePostId}/from/${profileId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "The param likePostId must be a number." }] })
    .expect(400);
});

test("Create Like On Post route fails if profileId is not a number", async () => {
  const token = "notAToken";
  const likePostId = -1;
  const profileId = "xyz";

  await request(app)
    .post(`/like/post/${likePostId}/from/${profileId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "The param profileId must be a number." }] })
    .expect(400);
});

test("Create Like On Post route fails if authHeader is missing", async () => {
  const likePostId = -1;
  const profileId = -1;

  await request(app)
    .post(`/like/post/${likePostId}/from/${profileId}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Create Like On Post route fails if authHeader is corrupted", async () => {
  const token = "notAToken";
  const likePostId = -1;
  const profileId = -1;

  await request(app)
    .post(`/like/post/${likePostId}/from/${profileId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Create Like On Post route fails if authHeader isn't for owner of profileId", async () => {
  const { user: lillyAccount, post: lillyPost } =
    await generateUserProfilePost("Lilly Evans");
  const { user: severusAccount, profile: severusSnape } =
    await generateUserAndProfile("Severus Snape");

  await request(app)
    .post(`/like/post/${lillyPost.id}/from/${severusSnape.id}`)
    .set("Authorization", `Bearer ${lillyAccount.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Access to that is not allowed from this account." }],
    })
    .expect(403);

  await deleteUser(severusAccount);
  await deleteUser(lillyAccount);
});

test("Create Like On Post route fails if likePostId is for a nonexistent post", async () => {
  const { user: lillyAccount, post: lillyPost } =
    await generateUserProfilePost("Lilly Evans");
  const { user: severusAccount, profile: severusSnape } =
    await generateUserAndProfile("Severus Snape");

  await request(app)
    .post(`/like/post/${lillyPost.id - 1000}/from/${severusSnape.id}`)
    .set("Authorization", `Bearer ${severusAccount.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "That post was not found." }],
    })
    .expect(404);

  await deleteUser(severusAccount);
  await deleteUser(lillyAccount);
});

test("Create Like On Post route succeeds if all provided info is correct", async () => {
  const { user: lillyAccount, post: lillyPost } =
    await generateUserProfilePost("Lilly Evans");
  const { user: severusAccount, profile: severusSnape } =
    await generateUserAndProfile("Severus Snape");

  await request(app)
    .post(`/like/post/${lillyPost.id}/from/${severusSnape.id}`)
    .set("Authorization", `Bearer ${severusAccount.token}`)
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      expect(res.body.id).toBeGreaterThan(0);
      expect(res.body.profileId).toBe(severusSnape.id);
      expect(res.body.postId).toBe(lillyPost.id);
      expect(res.body.commentId).toBe(null);
    });

  await deleteUser(severusAccount);
  await deleteUser(lillyAccount);
});

// like deletion tests
test("Delete Like route fails if likeId is missing", async () => {
  const token = "notAToken";
  const likeId = "";

  await request(app)
    .delete(`/like/${likeId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Delete Like route fails if likeId is not a number", async () => {
  const token = "notAToken";
  const likeId = "xyz";

  await request(app)
    .delete(`/like/${likeId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "The param likeId must be a number." }] })
    .expect(400);
});

test("Delete Like route fails if authHeader is missing", async () => {
  const likeId = -1;

  await request(app)
    .delete(`/like/${likeId}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Delete Like route fails if authHeader is corrupted", async () => {
  const token = "notAToken";
  const likeId = -1;

  await request(app)
    .delete(`/like/${likeId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Delete Like route fails if trying to delete another user's like", async () => {
  const {
    user: lillyAccount,
    profile: lillyProfile,
    post: lillyPost,
  } = await generateUserProfilePost("Lilly Potter (Evans)");
  const { user: severusAccount, profile: severusSnape } =
    await generateUserAndProfile("Severus Snape");

  const likeRes = await request(app)
    .post(`/like/post/${lillyPost.id}/from/${severusSnape.id}`)
    .set("Authorization", `Bearer ${severusAccount.token}`)
    .expect("Content-Type", /json/)
    .expect(200);

  const like = likeRes.body;

  await request(app)
    .delete(`/like/${like.id}`)
    .set("Authorization", `Bearer ${lillyAccount.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message: "You're not able to perform that action from this account.",
        },
      ],
    })
    .expect(403);

  await deleteUser(lillyAccount);
  await deleteUser(severusAccount);
});

test("Delete Like route fails if trying to delete a like that doesn't exist", async () => {
  const {
    user: lillyAccount,
    profile: lillyProfile,
    post: lillyPost,
  } = await generateUserProfilePost("Lilly Potter (Evans)");
  const { user: severusAccount, profile: severusSnape } =
    await generateUserAndProfile("Severus Snape");

  const likeRes = await request(app)
    .post(`/like/post/${lillyPost.id}/from/${severusSnape.id}`)
    .set("Authorization", `Bearer ${severusAccount.token}`)
    .expect("Content-Type", /json/)
    .expect(200);

  const like = likeRes.body;

  await request(app)
    .delete(`/like/${like.id - 1000}`)
    .set("Authorization", `Bearer ${severusAccount.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message: "You're not able to perform that action from this account.",
        },
      ],
    })
    .expect(403);

  await deleteUser(lillyAccount);
  await deleteUser(severusAccount);
});

test("Delete Like route succeeds if all provided info is correct", async () => {
  const {
    user: lillyAccount,
    profile: lillyProfile,
    post: lillyPost,
  } = await generateUserProfilePost("Lilly Potter (Evans)");
  const { user: severusAccount, profile: severusSnape } =
    await generateUserAndProfile("Severus Snape");

  const likeRes = await request(app)
    .post(`/like/post/${lillyPost.id}/from/${severusSnape.id}`)
    .set("Authorization", `Bearer ${severusAccount.token}`)
    .expect("Content-Type", /json/)
    .expect(200);

  const like = likeRes.body;

  await request(app)
    .delete(`/like/${like.id}`)
    .set("Authorization", `Bearer ${severusAccount.token}`)
    .expect("Content-Type", /json/)
    .expect(like)
    .expect(200);

  await deleteUser(lillyAccount);
  await deleteUser(severusAccount);
});
