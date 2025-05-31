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