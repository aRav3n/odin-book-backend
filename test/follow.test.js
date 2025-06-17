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
  generateCommentAndParents,
  generateUserAndProfile,
  generateUserProfilePost,
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
  // await deleteEveryone();
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
    .expect({ errors: [{ message: "The param followingId must be a number." }] })
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
    // .expect([])
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

/*
test("Update Follow route fails if followId is missing", async () => {});

test("Update Follow route fails if followId isn't a number", async () => {});

test("Update Follow route fails if authHeader is missing", async () => {});

test("Update Follow route fails if authHeader is corrupted", async () => {});

test("Update Follow route fails if followId is for a nonexistent follow", async () => {});

test("Update Follow route fails if authHeader user.id isn't followingId", async () => {});

test("Update Follow route succeeds if all information provided is correct", async () => {});

test("Delete Follow route fails if followId is missing", async () => {});

test("Delete Follow route fails if followId isn't a number", async () => {});

test("Delete Follow route fails if authHeader is missing", async () => {});

test("Delete Follow route fails if authHeader is corrupted", async () => {});

test("Delete Follow route fails if followId is for a nonexistent follow", async () => {});

test("Delete Follow route fails if authHeader user.id isn't follow.followingId or follow.followerId", async () => {});

test("Delete Follow route succeeds if all information provided is correct", async () => {});
*/
