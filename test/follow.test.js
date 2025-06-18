/* to run only this test:
  clear & npx tsc & npx jest test/follow.test.js
*/

const router = require("../routes/router");

const request = require("supertest");
const express = require("express");
const app = express();
require("dotenv");

app.use(express.urlencoded({ extended: false }));
app.use("/", router);

const {
  deleteEveryone,
  generateJamesFollowingLilly,
  generateUserAndProfile,
  deleteUser,
} = require("./internalTestFunctions");

let followStart;

beforeEach(() => {
  followStart = Date.now();
});

afterEach(() => {
  const duration = Date.now() - followStart;
  const testName = expect.getState().currentTestName;
  if (duration >= 500) {
    console.log(`${testName} - ${duration} ms`);
  }
});

afterAll(async () => {
  // const deleted = await deleteEveryone();
  // console.log(deleted);
});

test("Create Follow route fails if profileId is missing", async () => {
  const token = "notAToken";
  const profileId = "";
  const followerId = "xyz";

  await request(app)
    .post(`/follow/${profileId}/from/${followerId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Create Follow route fails if followerId is missing", async () => {
  const token = "notAToken";
  const profileId = "xyz";
  const followerId = "";

  await request(app)
    .post(`/follow/${profileId}/from/${followerId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Create Follow route fails if profileId isn't a number", async () => {
  const token = "notAToken";
  const profileId = "xyz";
  const followerId = -1;

  await request(app)
    .post(`/follow/${profileId}/from/${followerId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "The param followingId must be a number." }],
    })
    .expect(400);
});

test("Create Follow route fails if followerId isn't a number", async () => {
  const token = "notAToken";
  const profileId = -1;
  const followerId = "xyz";

  await request(app)
    .post(`/follow/${profileId}/from/${followerId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "The param followerId must be a number." }] })
    .expect(400);
});

test("Create Follow route fails if authHeader is missing", async () => {
  const token = "notAToken";
  const profileId = -1;
  const followerId = -1;

  await request(app)
    .post(`/follow/${profileId}/from/${followerId}`)
    // .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Create Follow route fails if authHeader is corrupted", async () => {
  const token = "notAToken";
  const profileId = -1;
  const followerId = -1;

  await request(app)
    .post(`/follow/${profileId}/from/${followerId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Create Follow route fails if authHeader user's profile.id !== followerId", async () => {
  const { user, profile } = await generateUserAndProfile();
  const profileId = -1;
  const followerId = -1;

  await request(app)
    .post(`/follow/${profileId}/from/${followerId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message:
            "Action forbidden: You may only follow users from your own account.",
        },
      ],
    })
    .expect(403);

  await deleteUser(user);
});

// nonexistent followerId profile is taken care of during "Create Follow route fails if authHeader user's profile.id !== followerId"
test("Create Follow route fails if profileId is for a nonexistent profile", async () => {
  const { user, profile } = await generateUserAndProfile();
  const profileId = -1;
  const followerId = profile.id;

  await request(app)
    .post(`/follow/${profileId}/from/${followerId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message: "Unable to find the profile you are attempting to follow.",
        },
      ],
    })
    .expect(404);

  await deleteUser(user);
});

test("Create Follow route succeeds if all information provided is correct", async () => {
  const { user, profile } = await generateUserAndProfile();
  const { user: followingUser, profile: followingProfile } =
    await generateUserAndProfile();

  const profileId = followingProfile.id;
  const followerId = profile.id;

  await request(app)
    .post(`/follow/${profileId}/from/${followerId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      expect(res.body.id).toBeGreaterThan(0);
      expect(res.body.updatedAt).toBeDefined();
      expect(res.body.accepted).toBeFalsy();
      expect(res.body.followerId).toBe(followerId);
      expect(res.body.followingId).toBe(profileId);
    });

  await deleteUser(user);
  await deleteUser(followingUser);
});

test("Read Followers route fails if profileId is missing", async () => {
  const token = "notAToken";
  const profileId = "";

  await request(app)
    .get(`/follow/profile/followers/${profileId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Read Followers route fails if profileId isn't a number", async () => {
  const token = "notAToken";
  const profileId = "xyz";

  await request(app)
    .get(`/follow/profile/followers/${profileId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "The param profileId must be a number." }] })
    .expect(400);
});

test("Read Followers route fails if authHeader is missing", async () => {
  const profileId = -1;

  await request(app)
    .get(`/follow/profile/followers/${profileId}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Read Followers route fails if authHeader is corrupted", async () => {
  const token = "notAToken";
  const profileId = -1;

  await request(app)
    .get(`/follow/profile/followers/${profileId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Read Followers route fails if profileId is for a nonexistent profile", async () => {
  const { user, profile } = await generateUserAndProfile();
  const profileId = -1;

  await request(app)
    .get(`/follow/profile/followers/${profileId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Unable to find that profile." }] })
    .expect(404);

  await deleteUser(user);
});

test("Read Followers route succeeds if all provided information is correct", async () => {
  const { user: aUser, profile: aProfile } = await generateUserAndProfile();
  const { user: bUser, profile: bProfile } = await generateUserAndProfile();

  // check that aProfile starts with no followers
  await request(app)
    .get(`/follow/profile/followers/${aProfile.id}`)
    .set("Authorization", `Bearer ${bUser.token}`)
    .expect("Content-Type", /json/)
    .expect([])
    .expect(200)
    .then(async () => {
      // follow aProfile from bProfile
      await request(app)
        .post(`/follow/${aProfile.id}/from/${bProfile.id}`)
        .set("Authorization", `Bearer ${bUser.token}`)
        .expect("Content-Type", /json/)
        .expect(200)
        .then(async (res) => {
          // check that the follow object looks as it should
          expect(res.body.followerId).toBe(bProfile.id);
          expect(res.body.followingId).toBe(aProfile.id);

          // check that aProfile now has a follower and that it's bProfile
          await request(app)
            .get(`/follow/profile/followers/${aProfile.id}`)
            .set("Authorization", `Bearer ${aUser.token}`)
            .expect("Content-Type", /json/)
            .expect([
              {
                follower: {
                  id: bProfile.id,
                  name: bProfile.name,
                },
              },
            ])
            .expect(200);
        });
    });

  await deleteUser(aUser);
  await deleteUser(bUser);
});

test("Read Following route fails if profileId is missing", async () => {
  const token = "notAToken";
  const profileId = "";

  await request(app)
    .get(`/follow/profile/following/${profileId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Read Following route fails if profileId isn't a number", async () => {
  const token = "notAToken";
  const profileId = "xyz";

  await request(app)
    .get(`/follow/profile/following/${profileId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "The param profileId must be a number." }] })
    .expect(400);
});

test("Read Following route fails if authHeader is missing", async () => {
  const profileId = -1;

  await request(app)
    .get(`/follow/profile/following/${profileId}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Read Following route fails if authHeader is corrupted", async () => {
  const token = "notAToken";
  const profileId = -1;

  await request(app)
    .get(`/follow/profile/following/${profileId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Read Following route fails if profileId is for a nonexistent profile", async () => {
  const { user, profile } = await generateUserAndProfile();
  const profileId = -1;

  await request(app)
    .get(`/follow/profile/following/${profileId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Unable to find that profile." }] })
    .expect(404);

  await deleteUser(user);
});

test("Read Following route succeeds if all provided information is correct", async () => {
  const { user: severusAccount, profile: severusProfile } =
    await generateUserAndProfile("Severus Snape");
  const { user: lillyAccount, profile: lillyProfile } =
    await generateUserAndProfile("Lilly Potter");

  // check that aProfile starts not following any profiles
  await request(app)
    .get(`/follow/profile/following/${severusProfile.id}`)
    .set("Authorization", `Bearer ${lillyAccount.token}`)
    .expect("Content-Type", /json/)
    .expect([])
    .expect(200)
    .then(async () => {
      await request(app)
        .post(`/follow/${lillyProfile.id}/from/${severusProfile.id}`)
        .set("Authorization", `Bearer ${severusAccount.token}`)
        .expect("Content-Type", /json/)
        .expect(200)
        .then(async (res) => {
          expect(res.body.followerId).toBe(severusProfile.id);
          expect(res.body.followingId).toBe(lillyProfile.id);

          await request(app)
            .get(`/follow/profile/following/${severusProfile.id}`)
            .set("Authorization", `Bearer ${severusAccount.token}`)
            .expect("Content-Type", /json/)
            .expect([
              {
                following: {
                  id: lillyProfile.id,
                  name: lillyProfile.name,
                },
              },
            ])
            .expect(200);
        });
    });

  await deleteUser(severusAccount);
  await deleteUser(lillyAccount);
});

test("Update Follow route fails if followId is missing", async () => {
  const token = "notAToken";
  const followId = "";

  await request(app)
    .put(`/follow/${followId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Update Follow route fails if followId isn't a number", async () => {
  const token = "notAToken";
  const followId = "xyz";

  await request(app)
    .put(`/follow/${followId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "The param followId must be a number." }] })
    .expect(400);
});

test("Update Follow route fails if authHeader is missing", async () => {
  const followId = -1;

  await request(app)
    .put(`/follow/${followId}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Update Follow route fails if authHeader is corrupted", async () => {
  const token = "notAToken";
  const followId = -1;

  await request(app)
    .put(`/follow/${followId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Update Follow route fails if followId is for a nonexistent follow", async () => {
  const { user, profile } = await generateUserAndProfile();
  const followId = -1;

  await request(app)
    .put(`/follow/${followId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ accepted: "notABoolean" })
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message: "You're not able to perform that action from this account.",
        },
      ],
    })
    .expect(403);

  await deleteUser(user);
});

test("Update Follow route fails if authHeader user.id isn't followingId", async () => {
  const { lillyAccount, lillyProfile, jamesAccount, jamesProfile, follow } =
    await generateJamesFollowingLilly();

  await request(app)
    .put(`/follow/${follow.id}`)
    .set("Authorization", `Bearer ${jamesAccount.token}`)
    .type("form")
    .send({ accepted: "notABoolean" })
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message: "You're not able to perform that action from this account.",
        },
      ],
    })
    .expect(403);

  await deleteUser(jamesAccount);
  await deleteUser(lillyAccount);
});

test("Update Follow route fails if accepted is included but not a boolean", async () => {
  const { lillyAccount, lillyProfile, jamesAccount, jamesProfile, follow } =
    await generateJamesFollowingLilly();

  await request(app)
    .put(`/follow/${follow.id}`)
    .set("Authorization", `Bearer ${lillyAccount.token}`)
    .type("form")
    .send({ accepted: "notABoolean" })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Accepted must be a boolean." }] })
    .expect(400);

  await deleteUser(jamesAccount);
  await deleteUser(lillyAccount);
});

test("Update Follow route fails if accepted is missing", async () => {
  const { lillyAccount, lillyProfile, jamesAccount, jamesProfile, follow } =
    await generateJamesFollowingLilly();

  await request(app)
    .put(`/follow/${follow.id}`)
    .set("Authorization", `Bearer ${lillyAccount.token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Accepted must be a boolean." }] })
    .expect(400);

  await deleteUser(jamesAccount);
  await deleteUser(lillyAccount);
});

test("Update Follow route succeeds if all information provided is correct", async () => {
  const { lillyAccount, lillyProfile, jamesAccount, jamesProfile, follow } =
    await generateJamesFollowingLilly();

  await request(app)
    .put(`/follow/${follow.id}`)
    .set("Authorization", `Bearer ${lillyAccount.token}`)
    .type("form")
    .send({ accepted: true })
    .expect({ success: true })
    .expect(200);

  await deleteUser(jamesAccount);
  await deleteUser(lillyAccount);
});

test("Delete Follow route fails if followId is missing", async () => {
  const token = "notAToken";
  const followId = "";

  await request(app)
    .delete(`/follow/${followId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Delete Follow route fails if followId isn't a number", async () => {
  const token = "notAToken";
  const followId = "xyz";

  await request(app)
    .delete(`/follow/${followId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "The param deleteFollowId must be a number." }],
    })
    .expect(400);
});

test("Delete Follow route fails if authHeader is missing", async () => {
  const followId = -1;

  await request(app)
    .delete(`/follow/${followId}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Delete Follow route fails if authHeader is corrupted", async () => {
  const token = "notAToken";
  const followId = -1;

  await request(app)
    .delete(`/follow/${followId}`)
    .set("Authorization", `Bearer ${token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Please sign in again and re-try that." }] })
    .expect(401);
});

test("Delete Follow route fails if followId is for a nonexistent follow", async () => {
  const { user, profile } = await generateUserAndProfile();
  const followId = -1;

  await request(app)
    .delete(`/follow/${followId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message: "You're not able to perform that action from this account.",
        },
      ],
    })
    .expect(403);

  await deleteUser(user);
});

test("Delete Follow route fails if authHeader user.id isn't owner of follow.followingId or follow.followerId", async () => {
  const { lillyAccount, jamesAccount, follow } =
    await generateJamesFollowingLilly();
  const { user: snapeAccount } = await generateUserAndProfile("Severus Snape");

  await request(app)
    .delete(`/follow/${follow.id}`)
    .set("Authorization", `Bearer ${snapeAccount.token}`)
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
  await deleteUser(jamesAccount);
  await deleteUser(snapeAccount);
});

test("Delete Follow route succeeds from followed user's account", async () => {
  const { lillyAccount, jamesAccount, follow } =
    await generateJamesFollowingLilly();

  await request(app)
    .delete(`/follow/${follow.id}`)
    .set("Authorization", `Bearer ${lillyAccount.token}`)
    .expect("Content-Type", /json/)
    .expect({ success: true })
    .expect(200);

  await deleteUser(lillyAccount);
  await deleteUser(jamesAccount);
});

test("Delete Follow route succeeds from following user's account", async () => {
  const { lillyAccount, jamesAccount, follow } =
    await generateJamesFollowingLilly();

  await request(app)
    .delete(`/follow/${follow.id}`)
    .set("Authorization", `Bearer ${jamesAccount.token}`)
    .expect("Content-Type", /json/)
    .expect({ success: true })
    .expect(200);

  await deleteUser(lillyAccount);
  await deleteUser(jamesAccount);
});
