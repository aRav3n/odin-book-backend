// to run only this test:    clear & npx jest test/profile.test.js

const router = require("../routes/router");

const request = require("supertest");
const express = require("express");
const app = express();
require("dotenv");

app.use(express.urlencoded({ extended: false }));
app.use("/", router);

const {
  deleteEveryone,
  deleteUser,
  generateSignedInUser,
  generateUserAndProfile,
  generateUserProfileObject,
  testTimeToLogIfOver,
} = require("./internalTestFunctions");

let profileStart;

beforeEach(() => {
  profileStart = Date.now();
});

afterEach(() => {
  const duration = Date.now() - profileStart;
  const testName = expect.getState().currentTestName;
  if (duration >= testTimeToLogIfOver) {
    console.log(`${testName} - ${duration} ms`);
  }
});

/*
afterAll(async () => {
  const deleted = await deleteEveryone();
  console.log(deleted);
});
*/

// create profile tests
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

test("Create Profile route fails if a profile already exists for the user", async () => {
  const { user } = await generateUserAndProfile();

  await request(app)
    .post("/profile")
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ name: "Corran Horn" })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "A profile for this account already exists" }],
    })
    .expect(409);

  await deleteUser(user);
});

test("Create Profile route succeeds when using a good authHeader and name, website and about can be blank", async () => {
  const user = await generateSignedInUser();
  const profile = generateUserProfileObject();
  const rebelAllianceLogoUrl =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Rebel_Alliance_logo.svg/1280px-Rebel_Alliance_logo.svg.png";
  profile.avatarUrl = rebelAllianceLogoUrl;

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
  expect(newProfile.avatarUrl).toBe(rebelAllianceLogoUrl);

  await deleteUser(user);
});

// read profile based on profileId
test("Read Profile route fails if :profileId is not present", async () => {
  await request(app)
    .get("/profile/")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "You must be logged in to do that." }] })
    .expect(401);
});

test("Read Profile route fails if :profileId is not a number", async () => {
  await request(app)
    .get("/profile/xyz")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "The param profileId must be a number." }] })
    .expect(400);
});

test("Read Profile route fails without authHeader", async () => {
  const profileId = 1;
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
  const profileId = 1;
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
  const user = await generateSignedInUser();

  const profileId = -1;
  await request(app)
    .get(`/profile/${profileId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Could not find that profile, please try again." }],
    })
    .expect(404);

  await deleteUser(user);
});

test("Read Profile route succeeds when using a good authHeader and valid id", async () => {
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
      expect(body.posts.length).toBe(0);
      expect(body.avatarUrl).toBeDefined();
    });

  await deleteUser(user);
});

// read profile list route tests
test("Read Profile List route fails without authHeader", async () => {
  await request(app)
    .post("/profile/list")
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "You must be logged in to do that." }],
    })
    .expect(401);
});

test("Read Profile List route fails with corrupted authHeader", async () => {
  await request(app)
    .post("/profile/list")
    .set("Authorization", "Bearer broken_t0k3n")
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Please sign in again and re-try that." }],
    })
    .expect(401);
});

test("Read Profile List route fails if no profiles match stringToMatch", async () => {
  const user = await generateSignedInUser();

  await request(app)
    .post("/profile/list")
    .set("Authorization", `Bearer ${user.token}`)
    .type("form")
    .send({ stringToMatch: "meLlamoAndres" })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Sorry, no matching profiles found!" }],
    })
    .expect(404);

  await deleteUser(user);
});

test("Read Profile List route returns alphabetized list of profile names with ids if stringToMatch is blank", async () => {
  const { user: anakinAccount, profile: anakinProfile } =
    await generateUserAndProfile("Anakin Chosen Juan Skywalker");
  const { user: lukeAccount, profile: lukeProfile } =
    await generateUserAndProfile("Lucas Amadeus Vasquez Skywalker");
  const { user: thrawnAccount, profile: thrawnProfile } =
    await generateUserAndProfile("Grand Admiral Thrawn");

  await request(app)
    .post("/profile/list")
    .set("Authorization", `Bearer ${lukeAccount.token}`)
    .type("form")
    .send({ stringToMatch: "" })
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      const array = res.body;
      const indexAnakin = array.findIndex(
        (item) => item.id === anakinProfile.id
      );
      const indexLuke = array.findIndex((item) => item.id === lukeProfile.id);
      const indexThrawn = array.findIndex(
        (item) => item.id === thrawnProfile.id
      );

      expect(indexAnakin).toBeLessThan(indexThrawn);
      expect(indexThrawn).toBeLessThan(indexLuke);
    });

  await deleteUser(anakinAccount);
  await deleteUser(lukeAccount);
  await deleteUser(thrawnAccount);
});

test("Read Profile List route returns alphabetized list of profile names with ids if stringToMatch is nonexistent", async () => {
  const { user: anakinAccount, profile: anakinProfile } =
    await generateUserAndProfile("Anakin Chosen Juan Skywalker");
  const { user: lukeAccount, profile: lukeProfile } =
    await generateUserAndProfile("Lucas Amadeus Vasquez Skywalker");
  const { user: thrawnAccount, profile: thrawnProfile } =
    await generateUserAndProfile("Grand Admiral Thrawn");

  await request(app)
    .post("/profile/list")
    .set("Authorization", `Bearer ${lukeAccount.token}`)
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      const array = res.body;
      const indexAnakin = array.findIndex(
        (item) => item.id === anakinProfile.id
      );
      const indexLuke = array.findIndex((item) => item.id === lukeProfile.id);
      const indexThrawn = array.findIndex(
        (item) => item.id === thrawnProfile.id
      );

      expect(indexAnakin).toBeLessThan(indexThrawn);
      expect(indexThrawn).toBeLessThan(indexLuke);
    });

  await deleteUser(anakinAccount);
  await deleteUser(lukeAccount);
  await deleteUser(thrawnAccount);
});

test("Read Profile List route returns alphabetized list of profile names with ids matching stringToMatch", async () => {
  const { user: anakinAccount, profile: anakinProfile } =
    await generateUserAndProfile("Anakin Chosen Juan Skywalker");
  const { user: lukeAccount, profile: lukeProfile } =
    await generateUserAndProfile("Lucas Amadeus Vasquez Skywalker");
  const { user: thrawnAccount, profile: thrawnProfile } =
    await generateUserAndProfile("Grand Admiral Thrawn");

  await request(app)
    .post("/profile/list")
    .set("Authorization", `Bearer ${lukeAccount.token}`)
    .type("form")
    .send({ stringToMatch: "an" })
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      const array = res.body;
      let containsLuke = false;
      for (let i = 0; i < array.length; i++) {
        if (array[i].name === lukeProfile.name) {
          containsLuke = true;
        }
      }

      expect(containsLuke).toBeFalsy();

      expect(array[0].id).toBeDefined();
      expect(array[0].userId).toBeDefined();
      expect(array[0].name).toBeDefined();
      expect(array[0].about).toBeDefined();
      expect(array[0].website).toBeDefined();
      expect(array[0].avatarUrl).toBeDefined();
    });

  await deleteUser(anakinAccount);
  await deleteUser(lukeAccount);
  await deleteUser(thrawnAccount);
});

// read profile (based on user token) route tests
test("Read User Profile route fails without authHeader", async () => {
  await request(app)
    .get("/profile")
    .type("form")
    .send({ ourOnlyHope: "Obi-Wan Kenobi" })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "You must be logged in to do that." }],
    })
    .expect(401);
});

test("Read User Profile route fails with corrupted authHeader", async () => {
  await request(app)
    .get("/profile")
    .set("Authorization", "Bearer broken_t0k3n")
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Please sign in again and re-try that." }],
    })
    .expect(401);
});

test("Read User Profile fails if no profile for this user", async () => {
  const user = await generateSignedInUser();

  await request(app)
    .get("/profile")
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "No profile found for your account." }],
    })
    .expect(404);

  await deleteUser(user);
});

test("Read User Profile route succeeds when using a good authHeader and valid id", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .get("/profile")
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
      expect(body.avatarUrl).toBeDefined();
    });

  await deleteUser(user);
});

// update profile
test("Update Profile route fails if req.body is blank", async () => {
  const profileId = 1;
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

test("Update Profile route fails if :profileId is not present", async () => {
  await request(app)
    .put("/profile/")
    .type("form")
    .send({ ourOnlyHope: "Obi-Wan Kenobi" })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Update Profile route fails if :profileId is not a number", async () => {
  await request(app)
    .put("/profile/xyz")
    .type("form")
    .send({ ourOnlyHope: "Obi-Wan Kenobi" })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "The param profileId must be a number." }] })
    .expect(400);
});

test("Update Profile route fails without authHeader", async () => {
  const profileId = 1;
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
  const profileId = 1;
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
  const userOne = await generateSignedInUser();
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
          message: "Access to that is not allowed from this account.",
        },
      ],
    })
    .expect(403);

  await deleteUser(userOne);
  await deleteUser(userTwo);
});

test("Update Profile fails with id for nonexistent profile", async () => {
  const user = await generateSignedInUser();
  const profileId = -1;

  await request(app)
    .put(`/profile/${profileId}`)
    .type("form")
    .send({ niceShot: "Don't get cocky" })
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
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

test("Update Profile route fails if req.body.name is blank", async () => {
  const { user, profile } = await generateUserAndProfile();

  await request(app)
    .put(`/profile/${profile.id}`)
    .type("form")
    .send({ niceShot: "Don't get cocky" })
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Name must exist." }] })
    .expect(400);

  await deleteUser(user);
});

test("Update Profile route succeeds when using a good authHeader and valid id", async () => {
  const { user, profile } = await generateUserAndProfile();
  const profileUpdate = {
    ...profile,
    name: "Parvati Patil",
    website: "https://harrypotter.fandom.com/wiki/Gryffindor",
    avatarUrl:
      "https://static.wikia.nocookie.net/harrypotter/images/b/b1/Gryffindor_ClearBG.png",
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
      expect(body.avatarUrl).toBe(profileUpdate.avatarUrl);
      expect(body.posts).toEqual([]);
      expect(200);
    });

  await deleteUser(user);
});

// delete profile
test("Delete Profile route fails if :profileId is not present", async () => {
  await request(app)
    .delete("/profile/")
    .type("form")
    .send({ secretToHappiness: "Appreciating the small things." })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Delete Profile route fails if :profileId is not a number", async () => {
  const profileId = "xyz";
  await request(app)
    .delete(`/profile/${profileId}`)
    .type("form")
    .send({ secretToHappiness: "Appreciating the small things." })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "The param profileId must be a number." }] })
    .expect(400);
});

test("Delete Profile route fails without authHeader", async () => {
  const profileId = 1;
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
  const profileId = 1;
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
  const userOne = await generateSignedInUser();
  const { user: userTwo, profile: profileTwo } = await generateUserAndProfile();

  await request(app)
    .delete(`/profile/${profileTwo.id}`)
    .set("Authorization", `Bearer ${userOne.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        {
          message: "Access to that is not allowed from this account.",
        },
      ],
    })
    .expect(403);

  await deleteUser(userOne);
  await deleteUser(userTwo);
});

test("Delete Profile fails with id for nonexistent profile", async () => {
  const user = await generateSignedInUser();
  const profileId = -1;

  await request(app)
    .delete(`/profile/${profileId}`)
    .set("Authorization", `Bearer ${user.token}`)
    .expect("Content-Type", /json/)
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

test("Delete Profile fails if profile has already been deleted", async () => {
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
          message: "Access to that is not allowed from this account.",
        },
      ],
    })
    .expect(403);

  await deleteUser(user);
});

test("Delete Profile route succeeds when using a good authHeader and valid id", async () => {
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
