// to run only this test:    clear & npx jest test/post.test.js

const router = require("../routes/router");

const request = require("supertest");
const express = require("express");
const app = express();
require("dotenv");

app.use(express.urlencoded({ extended: false }));
app.use("/", router);

const {
  generateSignedInUser,
  generateUserAndProfile,
  generateUserProfilePost,
  deleteEveryone,
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

/*
afterAll(async () => {
  const deleted = await deleteEveryone();
  console.log(deleted);
});
*/

// create post route
test("Create Post route fails if :profileId is not present", async () => {
  await request(app)
    .post("/post")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Create Post route fails if :profileId is not a number", async () => {
  await request(app)
    .post("/post/xyz")
    .type("form")
    .send({ whoIsBack: "Backstreet" })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "The param profileId must be a number." }] })
    .expect(400);
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
  const user = await generateSignedInUser();
  await request(app)
    .post("/post/xyz")
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ doesSizeMatterAccordingToYoda: false })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "The param profileId must be a number." }] })
    .expect(400);

  await deleteUser(user);
});

test("Create Post route fails if the profile with profileId doesn't belong to the user with the authHeader", async () => {
  const user = await generateSignedInUser();
  const profileId = -1;

  await request(app)
    .post(`/post/${profileId}`)
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
          message: "Access to that is not allowed from this account.",
        },
      ],
    })
    .expect(403);

  await deleteUser(user);
});

test("Create Post route fails if text nonexistent", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .post(`/post/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({ soCute: "Bye bye" })
    .expect({ errors: [{ message: "Text must be included" }] })
    .expect(400);

  await deleteUser(user);
});

test("Create Post route fails if text blank", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .post(`/post/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({ text: "" })
    .expect({ errors: [{ message: "Text must be included" }] })
    .expect(400);

  await deleteUser(user);
});

test("Create Post route fails if text is not a string", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .post(`/post/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({ text: true })
    .expect({ errors: [{ message: "Text must be a string" }] })
    .expect(400);

  await deleteUser(user);
});

test("Create Post route succeeds if all required info is correct", async () => {
  const { user, profile } = await generateUserAndProfile();
  const text = "Do, or do not, there is no try.";

  await request(app)
    .post(`/post/${profile.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .type("form")
    .send({ text })
    .then((res) => {
      expect(res.body.id).toBeDefined;
      expect(res.body.text).toBe(text);
      expect(res.body.profileId).toBe(profile.id);
      expect(res.body.Profile.name).toBe(profile.name);
      expect(200);
    });

  await deleteUser(user);
});

// read single post route
test("Read Post route fails if postId is missing", async () => {
  await request(app)
    .get("/post/single/")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Read Post route fails if postId is not a number", async () => {
  await request(app)
    .get("/post/single/xyz")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "The param postId must be a number." }] })
    .expect(400);
});

test("Read Post route fails with missing authHeader", async () => {
  await request(app)
    .get("/post/single/1")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Read Post route fails with corrupted authHeader", async () => {
  await request(app)
    .get("/post/single/1")
    .set("Authorization", "Bearer notAToken")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Read Post route fails if a post with the id of postId doesn't exist", async () => {
  const user = await generateSignedInUser();

  await request(app)
    .get("/post/single/-1")
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "No post with an id of -1 found." }] })
    .expect(404);

  await deleteUser(user);
});

test("Read Post route succeeds with good authHeader and correct postId", async () => {
  const { user, profile, post } = await generateUserProfilePost();

  await request(app)
    .get(`/post/single/${post.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      expect(res.body.id).toBe(post.id);
      expect(res.body.createdAt).toBe(post.createdAt);
      expect(res.body.profileId).toBe(profile.id);
      expect(res.body.Profile.name).toBe(profile.name);
      expect(res.body.text).toBe(post.text);
      expect(res.body._count.comments).toBeDefined();
      expect(res.body._count.likes).toBeDefined();
    });

  await deleteUser(user);
});

// read recent posts route
test("Read Recent Posts route fails if :start is missing", async () => {
  await request(app)
    .get("/post/recent/")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Read Recent Posts route fails if :start is not a number", async () => {
  const start = "xyz";
  await request(app)
    .get(`/post/recent/${start}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "The param start must be a number." }] })
    .expect(400);
});

test("Read Recent Posts route fails with missing authHeader", async () => {
  const start = -1;
  await request(app)
    .get(`/post/recent/${start}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Read Recent Posts route fails with corrupted authHeader", async () => {
  const start = -1;
  const token = "notAToken";

  await request(app)
    .get(`/post/recent/${start}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Read Recent Posts route returns empty array if there no posts in that range", async () => {
  const user = await generateSignedInUser();
  const start = 1000;

  await request(app)
    .get(`/post/recent/${start}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect([])
    .expect(200);

  await deleteUser(user);
});

test("Read Recent Posts route succeeds with correct info, safely handling :start numbers less than 1", async () => {
  const {
    user: userOne,
    profile: profileOne,
    post: postOne,
  } = await generateUserProfilePost();
  const { user: userTwo, post: postTwo } = await generateUserProfilePost();
  const { user: userThree, post: postThree } = await generateUserProfilePost();
  const { user: userFour, post: postFour } = await generateUserProfilePost();
  const { user: userFive, post: postFive } = await generateUserProfilePost();
  const { user: userSix, post: postSix } = await generateUserProfilePost();
  const { user: userSeven, post: postSeven } = await generateUserProfilePost();
  const { user: userEight, post: postEight } = await generateUserProfilePost();
  const { user: userNine, post: postNine } = await generateUserProfilePost();

  const firstStart = -100;
  await request(app)
    .get(`/post/recent/${firstStart}`)
    .set("Authorization", `Bearer ${userOne.token}`)
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      const array = res.body;
      const indexOne = array.findIndex((item) => item.id === postOne.id);
      const indexTwo = array.findIndex((item) => item.id === postTwo.id);
      const indexThree = array.findIndex((item) => item.id === postThree.id);
      const indexFour = array.findIndex((item) => item.id === postFour.id);
      const indexFive = array.findIndex((item) => item.id === postFive.id);
      const indexSix = array.findIndex((item) => item.id === postSix.id);
      const indexSeven = array.findIndex((item) => item.id === postSeven.id);
      const indexEight = array.findIndex((item) => item.id === postEight.id);
      const indexNine = array.findIndex((item) => item.id === postNine.id);

      expect(indexOne).toBeGreaterThan(indexTwo);
      expect(indexTwo).toBeGreaterThan(indexThree);
      expect(indexThree).toBeGreaterThan(indexFour);
      expect(indexFour).toBeGreaterThan(indexFive);
      expect(indexFive).toBeGreaterThan(indexSix);
      expect(indexSix).toBeGreaterThan(indexSeven);
      expect(indexSeven).toBeGreaterThan(indexEight);
      expect(indexEight).toBeGreaterThan(indexNine);

      expect(array[indexOne].Profile.name).toBe(profileOne.name);
      expect(array[indexOne].Profile.id).toBe(profileOne.id);
      expect(array[indexOne]._count.comments).toBe(0);
      expect(array[indexOne]._count.likes).toBe(0);
    });

  const secondStart = 3;
  await request(app)
    .get(`/post/recent/${secondStart}`)
    .set("Authorization", `Bearer ${userOne.token}`)
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      const array = res.body;
      const indexOne = array.findIndex((item) => item.id === postOne.id);
      const indexTwo = array.findIndex((item) => item.id === postTwo.id);
      const indexThree = array.findIndex((item) => item.id === postThree.id);
      const indexFour = array.findIndex((item) => item.id === postFour.id);
      const indexFive = array.findIndex((item) => item.id === postFive.id);
      const indexSix = array.findIndex((item) => item.id === postSix.id);
      const indexSeven = array.findIndex((item) => item.id === postSeven.id);

      expect(indexOne).toBeGreaterThan(indexTwo);
      expect(indexTwo).toBeGreaterThan(indexThree);
      expect(indexThree).toBeGreaterThan(indexFour);
      expect(indexFour).toBeGreaterThan(indexFive);
      expect(indexFive).toBeGreaterThan(indexSix);
      expect(indexSix).toBeGreaterThan(indexSeven);
    });

  await deleteUser(userOne);
  await deleteUser(userTwo);
  await deleteUser(userThree);
  await deleteUser(userFour);
  await deleteUser(userFive);
  await deleteUser(userSix);
  await deleteUser(userSeven);
  await deleteUser(userEight);
  await deleteUser(userNine);
});

// update post route
test("Update Post route fails if req.body is blank", async () => {
  await request(app)
    .put("/post/1")
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

test("Update Post route fails if :postId is missing", async () => {
  await request(app)
    .put("/post/")
    .set("Authorization", "Bearer bad_token")
    .type("form")
    .send({ soCute: "Bye bye" })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Update Post route fails if :postId is not a number", async () => {
  await request(app)
    .put("/post/xyz")
    .type("form")
    .send({ soCute: "Bye bye" })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "The param postId must be a number." }],
    })
    .expect(400);
});

test("Update Post route fails with missing authHeader", async () => {
  await request(app)
    .put("/post/1")
    .type("form")
    .send({ soCute: "Bye bye" })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Update Post route fails with corrupted authHeader", async () => {
  await request(app)
    .put("/post/1")
    .set("Authorization", "Bearer notAToken33")
    .type("form")
    .send({ soCute: "Bye bye" })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Update Post route fails if a post with the id of postId doesn't exist", async () => {
  const user = await generateSignedInUser();
  const postId = -1;

  await request(app)
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

  await deleteUser(user);
});

test("Update Post route fails if text nonexistent", async () => {
  const { user, post } = await generateUserProfilePost();

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

  await deleteUser(user);
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

  await deleteUser(user);
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
    .get(`/post/single/${post.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      expect(res.body.id).toBe(updatedPost.id);
      expect(res.body.createdAt).toBe(updatedPost.createdAt);
      expect(res.body.profileId).toBe(profile.id);
      expect(res.body.text).toBe(text);
    });

  await deleteUser(user);
});

// delete post route
test("Delete Post route fails if :postId is not present", async () => {
  await request(app)
    .delete("/post/")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Delete Post route fails if :postId is not a number", async () => {
  await request(app)
    .delete("/post/xyz")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "The param postId must be a number." }] })
    .expect(400);
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

test("Delete Post route fails if authHeader doesn't match post owner", async () => {
  const { user: userOne, post: postOne } = await generateUserProfilePost();
  const userTwo = await generateSignedInUser();

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

  await deleteUser(userOne);
  await deleteUser(userTwo);
});

test("Delete Post route succeeds if authHeader matches :postId owner", async () => {
  const { user, post } = await generateUserProfilePost();

  await request(app)
    .delete(`/post/${post.id}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect(post)
    .expect(200);

  await deleteUser(user);
});
