const router = require("../routes/router");

const request = require("supertest");
const express = require("express");
const app = express();
require("dotenv");

app.use(express.urlencoded({ extended: false }));
app.use("/", router);

const testUserBadEmail = {
  email: "badEmailAddress",
  password: "123456",
  confirmPassword: "123456",
};

const testUserBadPassword = {
  email: "c@b.com",
  password: "12345",
  confirmPassword: "12345",
};

const testUserBadPasswordConfirm = {
  email: "c@b.com",
  password: "123456",
  confirmPassword: "1234567",
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

test("Signup route fails with bad email", (done) => {
  request(app)
    .post("/user")
    .type("form")
    .send(testUserBadEmail)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Must be a valid email address." }] })
    .expect(400, done);
});
