/* to run only this test:
  clear & npx tsc & npx jest test/comment.test.js
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

let commentStart;

beforeEach(() => {
  commentStart = Date.now();
});

afterEach(() => {
  const duration = Date.now() - commentStart;
  const testName = expect.getState().currentTestName;
  if (duration >= 500) {
    console.log(`${testName} - ${duration} ms`);
  }
});

test("Create Comment On Post route fails if :postId is missing", async () => {
  await request(app)
    .post("/comment/post/")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Create Comment On Post route fails if :profileId is missing", async () => {
  await request(app)
    .post("/comment/post/-1/from/")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Create Comment On Post route fails if :postId is not a number", async () => {
  await request(app)
    .post("/comment/post/xyz/from/1")
    .type("form")
    .send({ whoIsBack: "Backstreet" })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Not all of your req.params were valid." }] })
    .expect(400);
});

test("Create Comment On Post route fails if :profileId is not a number", async () => {
  await request(app)
    .post("/comment/post/1/from/xyz")
    .type("form")
    .send({ whoIsBack: "Backstreet" })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Not all of your req.params were valid." }] })
    .expect(400);
});

test("Create Comment On Post route fails if req.body doesn't exist", async () => {
  await request(app)
    .post("/comment/post/1/from/1")
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

test("Create Comment On Post route fails if authHeader is missing", async () => {
  await request(app)
    .post("/comment/post/1/from/1")
    .expect("Content-Type", /json/)
    .type("form")
    .send({})
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Create Comment On Post route fails if token is corrupted", async () => {
  const token = "Not_a_validHeader";

  await request(app)
    .post("/comment/post/1/from/1")
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({})
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Create Comment On Post route fails if :postId is for a nonexistent post", async () => {
  const { user, profile, post } = await generateUserProfilePost();
  const nonexistentId = -1;

  await request(app)
    .post(`/comment/post/${nonexistentId}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({ text: "text", profileId: profile.id })
    .expect({
      errors: [
        { message: `A post with the id of ${nonexistentId} was not found.` },
      ],
    })
    .expect(404);

  await deleteUser(user);
});

test("Create Comment On Post route fails if :profileId is for a nonexistent profile", async () => {
  const { user, profile, post } = await generateUserProfilePost();
  const nonexistentId = -1;

  await request(app)
    .post(`/comment/post/${post.id}/from/${nonexistentId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({ text: "text", profileId: profile.id })
    .expect({
      errors: [
        { message: `A profile with an id of ${nonexistentId} was not found.` },
      ],
    })
    .expect(404);

  await deleteUser(user);
});

test("Create Comment On Post route fails if req.body.text doesn't exist", async () => {
  const { user, profile, post } = await generateUserProfilePost();

  await request(app)
    .post(`/comment/post/${post.id}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
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

  await deleteUser(user);
});

test("Create Comment On Post route fails if req.body.text is empty", async () => {
  const { user, profile, post } = await generateUserProfilePost();

  await request(app)
    .post(`/comment/post/${post.id}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({ text: "" })
    .expect({ errors: [{ message: "Text must be included" }] })
    .expect(400);

  await deleteUser(user);
});

test("Create Comment On Post route fails if req.body.text is not a string", async () => {
  const { user, profile, post } = await generateUserProfilePost();

  await request(app)
    .post(`/comment/post/${post.id}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({ text: true })
    .expect({ errors: [{ message: "Text must be a string" }] })
    .expect(400);

  await deleteUser(user);
});

test("Create Comment On Post route succeeds with correct requirements", async () => {
  const { user, profile, post } = await generateUserProfilePost();
  const text = "So true!";

  await request(app)
    .post(`/comment/post/${post.id}/from/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ text })
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      expect(res.body.id).toBeGreaterThan(0);
      expect(res.body.text).toBe(text);
      expect(res.body.profileId).toBe(profile.id);
      expect(res.body.postId).toBe(post.id);
      expect(res.body.commentId).toBeFalsy();
    });

  await request(app)
    .get(`/post/${post.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      expect(res.body._count.comments).toBe(1);
    });

  await deleteUser(user);
});

test("Get Comments On Post route fails if :postId is missing", async () => {
  const postId = "";
  await request(app)
    .get(`/comment/post/${postId}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Get Comments On Post route fails if :postId is not a number", async () => {
  const postId = "xyz";
  await request(app)
    .get(`/comment/post/${postId}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "No valid req.params were found." }] })
    .expect(400);
});

test("Get Comments On Post route fails if authHeader is missing", async () => {
  const postId = -1;
  await request(app)
    .get(`/comment/post/${postId}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Get Comments On Post route fails if authHeader is corrupted", async () => {
  const postId = -1;
  const token = "corruptedToken369";
  await request(app)
    .get(`/comment/post/${postId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Get Comments On Post route fails if :postId is for a nonexistent post", async () => {
  const { user, profile } = await generateUserAndProfile();
  const postId = -1;

  await request(app)
    .get(`/comment/post/${postId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "That post was not found in the database." }],
    })
    .expect(404);

  await deleteUser(user);
});

test("Get Comments On Post route succeeds with correct requirements", async () => {
  const { user, profile, post } = await generateUserProfilePost();

  await request(app)
    .get(`/comment/post/${post.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect([])
    .expect(200);

  await deleteUser(user);
});

/*
test("Create Comment Reply route fails if :commentId is missing", async () => {});

test("Create Comment Reply route fails if :profileId is missing", async () => {});

test("Create Comment Reply route fails if :commentId is not a number", async () => {});

test("Create Comment Reply route fails if :profileId is not a number", async () => {});

test("Create Comment Reply route fails if req.body doesn't exist", async () => {});

test("Create Comment Reply route fails if authHeader is missing", async () => {});

test("Create Comment Reply route fails if authHeader is corrupted", async () => {});

test("Create Comment Reply route fails if :commentId is for a nonexistent comment", async () => {});

test("Create Comment Reply route fails if :profileId is for a nonexistent profile", async () => {});

test("Create Comment Reply route fails if req.body.text doesn't exist", async () => {});

test("Create Comment Reply route fails if req.body.text is empty", async () => {});

test("Create Comment Reply route fails if req.body.text is not a string", async () => {});

test("Create Comment Reply route succeeds with correct requirements", async () => {});

test("Create Comment Reply route succeeds for a comment on a comment on a comment", async () => {});

test("Get Comment Replies route fails if :commentId is missing", async () => {});

test("Get Comment Replies route fails if authHeader is missing", async () => {});

test("Get Comment Replies route fails if authHeader is corrupted", async () => {});

test("Get Comment Replies route fails if :commentId is not a number", async () => {});

test("Get Comment Replies route fails if :commentId is for a nonexistent post", async () => {});

test("Get Comment Replies route succeeds with correct requirements", async () => {});

test("Get Comment Replies route succeeds for a comment on a comment on a comment", async () => {});

test("Update Comment route fails if :commentId is missing", async () => {});

test("Update Comment route fails if req.body doesn't exist", async () => {});

test("Update Comment route fails if req.body is empty", async () => {});

test("Update Comment route fails if authHeader is missing", async () => {});

test("Update Comment route fails if authHeader is corrupted", async () => {});

test("Update Comment route fails if user in authHeader isn't :commentId owner", async () => {});

test("Update Comment route fails if :commentId is not a number", async () => {});

test("Update Comment route fails if :commentId is for a nonexistent post", async () => {});

test("Update Comment route fails if req.body.newText doesn't exist", async () => {});

test("Update Comment route fails if req.body.newText is empty", async () => {});

test("Update Comment route fails if req.body.text is not a string", async () => {});

test("Update Comment route succeeds with correct requirements", async () => {});

test("Delete Comment route fails if :commentId is missing", async () => {});

test("Delete Comment route fails if authHeader is missing", async () => {});

test("Delete Comment route fails if authHeader is corrupted", async () => {});

test("Delete Comment route fails if user in authHeader isn't :commentId owner", async () => {});

test("Delete Comment route fails if :commentId is not a number", async () => {});

test("Delete Comment route fails if :commentId is for a nonexistent post", async () => {});

test("Delete Comment route succeeds with correct requirements", async () => {});
*/
