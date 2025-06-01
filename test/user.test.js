const router = require("../routes/router");

const request = require("supertest");
const express = require("express");
const app = express();
require("dotenv");

const { deleteAllUsers } = require("../db/queries");

app.use(express.urlencoded({ extended: false }));
app.use("/", router);

const badEmail = "notAnEmail_Address";
const goodEmail = "c@b.com";
const badPassword = "12345";
const goodPassword = "123456";

const testUserBadEmail = {
  email: badEmail,
  password: goodPassword,
  confirmPassword: goodPassword,
};

const testUserBadPassword = {
  email: goodEmail,
  password: badPassword,
  confirmPassword: badPassword,
};

const testUserBadPasswordConfirm = {
  email: goodEmail,
  password: goodPassword,
  confirmPassword: badPassword,
};

const testUserBadEverything = {
  email: badEmail,
  password: badPassword,
  confirmPassword: goodPassword,
};

const testUserOne = {
  email: "b@b.com",
  password: "123456",
  confirmPassword: "123456",
};

const testUserTwo = {
  email: "a@b.com",
  password: "123456",
  confirmPassword: "123456",
};

afterAll(async () => {
  const deletedUsers = await deleteAllUsers();
  testUserOne.id = null;
  testUserOne.token = null;
  console.log(`Cleaned up and deleted ${deletedUsers.count} user(s)`);
});

test("Signup route fails with bad email", (done) => {
  request(app)
    .post("/user")
    .type("form")
    .send(testUserBadEmail)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Must be a valid email address." }] })
    .expect(400, done);
});

test("Signup route fails with bad password", (done) => {
  request(app)
    .post("/user")
    .type("form")
    .send(testUserBadPassword)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Password must be between 6 and 16 characters." }],
    })
    .expect(400, done);
});

test("Signup route fails with bad password confirmation", (done) => {
  request(app)
    .post("/user")
    .type("form")
    .send(testUserBadPasswordConfirm)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Passwords must match." }],
    })
    .expect(400, done);
});

test("Signup route fails with multiple messages for multiple errors", (done) => {
  request(app)
    .post("/user")
    .type("form")
    .send(testUserBadEverything)
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        { message: "Must be a valid email address." },
        { message: "Password must be between 6 and 16 characters." },
        { message: "Passwords must match." },
      ],
    })
    .expect(400, done);
});

test("Signup route succeeds with good email and good password", (done) => {
  request(app)
    .post("/user")
    .type("form")
    .send(testUserOne)
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      testUserOne.id = res.body.id;
      expect(res.body.id).toBeGreaterThan(0);
      expect(res.body.email).toBe(testUserOne.email);
      expect(res.body.hash).not.toBeDefined();
      done();
    });
});

test("Signup route fails if user already exists", (done) => {
  request(app)
    .post("/user")
    .type("form")
    .send(testUserOne)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "User with this email already exists." }],
    })
    .expect(400, done);
});

test("Login route fails if no email and no password", (done) => {
  request(app)
    .post("/user/login")
    .type("form")
    .send({})
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "You need an email and password to log in." }],
    })
    .expect(403, done);
});

test("Login route fails if no email", (done) => {
  request(app)
    .post("/user/login")
    .type("form")
    .send({ password: testUserOne.password })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "You need an email and password to log in." }],
    })
    .expect(403, done);
});

test("Login route fails if no password", (done) => {
  request(app)
    .post("/user/login")
    .type("form")
    .send({ email: testUserOne.email })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "You need an email and password to log in." }],
    })
    .expect(403, done);
});

test("Login route fails if wrong email", (done) => {
  request(app)
    .post("/user/login")
    .type("form")
    .send(testUserTwo)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "No user with this email exists in the database." }],
    })
    .expect(403, done);
});

test("Login route fails if wrong password", (done) => {
  request(app)
    .post("/user/login")
    .type("form")
    .send({ email: testUserOne.email, password: badPassword })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "That password doesn't work; please try again." }],
    })
    .expect(403, done);
});

test("Login route succeeds with correct email and correct password", (done) => {
  request(app)
    .post("/user/login")
    .type("form")
    .send(testUserOne)
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      expect(res.body.id).toBe(testUserOne.id);
      expect(res.body.email).toBe(testUserOne.email);
      expect(res.body.token).toBeDefined();
      expect(res.body.hash).not.toBeDefined();
      testUserOne.token = res.body.token;
      done();
    });
});

test("Get Email route fails when not logged in", (done) => {
  request(app)
    .get(`/user/${testUserOne.id}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "You must be logged in to do that." }],
    })
    .expect(401, done);
});

test("Get Email route fails with bad token", (done) => {
  request(app)
    .get(`/user/${testUserOne.id}`)
    .set("Authorization", `Bearer ${badPassword}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Please sign in again and re-try that." }],
    })
    .expect(401, done);
});

test("Get Email route fails when trying to access other user's info", (done) => {
  request(app)
    .get("/user/0")
    .set("Authorization", `Bearer ${testUserOne.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        { message: "You have to be logged in to your account to access that." },
      ],
    })
    .expect(403, done);
});

test("Get Email route succeeds with the correct token", (done) => {
  console.log("expects:", testUserOne.email);
  request(app)
    .get(`/user/${testUserOne.id}`)
    .set("Authorization", `Bearer ${testUserOne.token}`)
    .expect("Content-Type", /json/)
    .expect({ email: testUserOne.email })
    .expect(200, done);
});
