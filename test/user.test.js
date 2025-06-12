/* to run only this test:
  clear & npx tsc & npx jest test/profile.test.js
*/

const router = require("../routes/router");

const request = require("supertest");
const express = require("express");
const app = express();
require("dotenv");

app.use(express.urlencoded({ extended: false }));
app.use("/", router);

const badEmail = "notAnEmail_Address";
const goodEmail = "c@b.com";
const badPassword = "12345";
const goodPassword = "123456";

const {
  deleteUser,
  generateUserObject,
  logInAndDelete,
  logUserIn,
  signUserUp,
} = require("./internalTestFunctions");

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

const userUpdate = {
  newEmail: goodEmail,
  newPassword: "1234567",
  newPasswordConfirm: "1234567",
};

const testUserTwo = {
  id: 0,
  email: "a@b.com",
  password: "123456",
  confirmPassword: "123456",
  token: null,
};

let userStart;

beforeEach(() => {
  userStart = Date.now();
});

afterEach(() => {
  const duration = Date.now() - userStart;
  const testName = expect.getState().currentTestName;
  if (duration >= 500) {
    console.log(`${testName} - ${duration} ms`);
  }
});

test("Signup User route fails if req.body doesn't exist", async () => {
  await request(app)
    .post("/user")
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

test("Signup User route fails with bad email", async () => {
  await request(app)
    .post("/user")
    .type("form")
    .send(testUserBadEmail)
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Must be a valid email address." }] })
    .expect(400);
});

test("Signup User route fails with bad password", async () => {
  await request(app)
    .post("/user")
    .type("form")
    .send(testUserBadPassword)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Password must be between 6 and 16 characters." }],
    })
    .expect(400);
});

test("Signup User route fails with bad password confirmation", async () => {
  await request(app)
    .post("/user")
    .type("form")
    .send(testUserBadPasswordConfirm)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Passwords must match." }],
    })
    .expect(400);
});

test("Signup User route fails with multiple messages for multiple errors", async () => {
  await request(app)
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
    .expect(400);
});

test("Signup User route fails if user already exists", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);

  await request(app)
    .post("/user")
    .type("form")
    .send(user)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "User with this email already exists." }],
    })
    .expect(400);

  await logInAndDelete(user);
});

test("Signup User route succeeds with good email and good password", async () => {
  const user = generateUserObject();

  await request(app)
    .post("/user")
    .type("form")
    .send(user)
    .expect("Content-Type", /json/)
    .then((res) => {
      expect(res.body.id).toBeGreaterThan(0);
      user.id = res.body.id;
      expect(res.body.email).toBe(user.email);
      expect(res.body.hash).not.toBeDefined();
      expect(200);
    });

  await logInAndDelete(user);
});

test("Login User route fails if req.body doesn't exist", async () => {
  await request(app)
    .post("/user/login")
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

test("Login User route fails if no email and no password", async () => {
  await request(app)
    .post("/user/login")
    .type("form")
    .send({})
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "You need an email and password to log in." }],
    })
    .expect(403);
});

test("Login User route fails if no email", async () => {
  const user = generateUserObject();

  await request(app)
    .post("/user/login")
    .type("form")
    .send({ password: user.password })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "You need an email and password to log in." }],
    })
    .expect(403);
});

test("Login User route fails if no password", async () => {
  const user = generateUserObject();

  await request(app)
    .post("/user/login")
    .type("form")
    .send({ email: user.email })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "You need an email and password to log in." }],
    })
    .expect(403);
});

test("Login User route fails if wrong email", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);

  await request(app)
    .post("/user/login")
    .type("form")
    .send(testUserTwo)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "No user with this email exists in the database." }],
    })
    .expect(403);

  await logInAndDelete(user);
});

test("Login User route fails if wrong password", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);

  await request(app)
    .post("/user/login")
    .type("form")
    .send({ email: user.email, password: badPassword })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "That password doesn't work; please try again." }],
    })
    .expect(403);

  await logInAndDelete(user);
});

test("Login User route succeeds with correct email and correct password", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);

  await request(app)
    .post("/user/login")
    .type("form")
    .send(user)
    .expect("Content-Type", /json/)
    .expect(200)
    .then((res) => {
      user.id = res.body.id;
      user.token = res.body.token;
      expect(res.body.id).toBeDefined();
      expect(res.body.email).toBe(user.email);
      expect(res.body.token).toBeDefined();
      expect(res.body.hash).not.toBeDefined();
    });

  await deleteUser(user);
});

test("Get User email route fails when :userId is not present", async () => {
  await request(app)
    .get("/user/")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Get User email route fails when :userId is not a number", async () => {
  await request(app)
    .get("/user/xyz")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "No valid req.params were found." }] })
    .expect(400);
});

test("Get User email route fails when not logged in", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);

  await request(app)
    .get(`/user/${user.id}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "You must be logged in to do that." }],
    })
    .expect(401);

  await logInAndDelete(user);
});

test("Get User email route fails with bad token", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);

  await request(app)
    .get(`/user/${user.id}`)
    .set("Authorization", `Bearer ${badPassword}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Please sign in again and re-try that." }],
    })
    .expect(401);

  await logInAndDelete(user);
});

test("Get User email route fails when trying to access other user's info", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);
  const loggedInUser = await logUserIn(user);

  await request(app)
    .get("/user/1")
    .set("Authorization", `Bearer ${loggedInUser.token}`)
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        { message: "You have to be logged in to your account to access that." },
      ],
    })
    .expect(403);

  await deleteUser(loggedInUser);
});

test("Get User email route succeeds with the correct token", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);
  const loggedInUser = await logUserIn(user);

  await request(app)
    .get(`/user/${loggedInUser.id}`)
    .set("Authorization", `Bearer ${loggedInUser.token}`)
    .expect("Content-Type", /json/)
    .expect({ email: loggedInUser.email })
    .expect(200);

  await deleteUser(loggedInUser);
});

test("Update Account route fails if req.body doesn't exist", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);

  await request(app)
    .put(`/user/${user.id}`)
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

  await logInAndDelete(user);
});

test("Update Account route fails if :userId is not present", async () => {
  await request(app)
    .put("/user/")
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "Route not found" }] })
    .expect(404);
});

test("Update Account route fails if :userId is not a number", async () => {
  await request(app)
    .put("/user/xyz")
    .type("form")
    .send({
      currentPassword: "password",
    })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "No valid req.params were found." }] })
    .expect(400);
});

test("Update Account route fails when not logged in", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);

  await request(app)
    .put(`/user/${user.id}`)
    .type("form")
    .send({
      ...userUpdate,
      currentPassword: user.password,
    })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "You must be logged in to do that." }],
    })
    .expect(401);

  await logInAndDelete(user);
});

test("Update Account route fails with bad token", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);

  await request(app)
    .put(`/user/${user.id}`)
    .set("Authorization", `Bearer ${badPassword}`)
    .type("form")
    .send({
      ...userUpdate,
      currentPassword: user.password,
    })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Please sign in again and re-try that." }],
    })
    .expect(401);

  await logInAndDelete(user);
});

test("Update Account route fails when trying to access other user's info", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);
  const loggedInUser = await logUserIn(user);

  await request(app)
    .put("/user/1")
    .set("Authorization", `Bearer ${loggedInUser.token}`)
    .type("form")
    .send({
      ...userUpdate,
      currentPassword: loggedInUser.password,
    })
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        { message: "You have to be logged in to your account to access that." },
      ],
    })
    .expect(403);

  await deleteUser(loggedInUser);
});

test("Update Account route fails if new email is invalid and password doesn't match confirmation", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);
  const loggedInUser = await logUserIn(user);

  await request(app)
    .put(`/user/${loggedInUser.id}`)
    .set("Authorization", `Bearer ${loggedInUser.token}`)
    .type("form")
    .send({
      newEmail: badEmail,
      currentEmail: loggedInUser.email,
      currentPassword: loggedInUser.password,
      newPassword: badPassword,
      newPasswordConfirm: userUpdate.newPassword,
    })
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        { message: "Your new email must be a valid email address." },
        {
          message: "Your new password must be between 6 and 16 characters.",
        },
        { message: "Password confirmation must match." },
      ],
    })
    .expect(400);

  await deleteUser(loggedInUser);
});

test("Update Account route fails if currentPassword is incorrect", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);
  const loggedInUser = await logUserIn(user);

  await request(app)
    .put(`/user/${loggedInUser.id}`)
    .set("Authorization", `Bearer ${loggedInUser.token}`)
    .type("form")
    .send({
      ...userUpdate,
      currentPassword: badPassword,
    })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Your current password is incorrect." }],
    })
    .expect(403);

  await deleteUser(loggedInUser);
});

test("Update Account route succeeds with correct info and token", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);
  const loggedInUser = await logUserIn(user);

  await request(app)
    .put(`/user/${loggedInUser.id}`)
    .set("Authorization", `Bearer ${loggedInUser.token}`)
    .type("form")
    .send({
      ...userUpdate,
      currentPassword: loggedInUser.password,
    })
    .then((res) => {
      loggedInUser.token = res.body.token;
      expect(res.body.id).toBe(loggedInUser.id);
      expect(res.body.email).toBe(userUpdate.newEmail);
      loggedInUser.email = userUpdate.newEmail;
      expect(res.body.hash).not.toBeDefined();
      loggedInUser.password = userUpdate.newPassword;
      expect(200);
    });

  await logInAndDelete(loggedInUser);
});

test("Delete User route fails if req.body doesn't exist", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);
  const loggedInUser = await logUserIn(user);

  await request(app)
    .delete(`/user/${user.id}`)
    .set("Authorization", `Bearer ${loggedInUser.token}`)
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

  await logInAndDelete(loggedInUser);
});

test("Delete User route fails if :userId is not present", async () => {
  await request(app)
    .delete("/user/")
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Route not found" }],
    })
    .expect(404);
});

test("Delete User route fails if :userIs is not a number", async () => {
  await request(app)
    .delete("/user/xyz")
    .type("form")
    .send({ password: "password" })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "No valid req.params were found." }] })
    .expect(400);
});

test("Delete User route fails when not logged in", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);

  await request(app)
    .delete(`/user/${user.id}`)
    .type("form")
    .send({ password: userUpdate.newPassword })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "You must be logged in to do that." }],
    })
    .expect(401);

  await logInAndDelete(user);
});

test("Delete User route fails with corrupted token", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);

  await request(app)
    .delete(`/user/${user.id}`)
    .set("Authorization", `Bearer ${badPassword}`)
    .type("form")
    .send({ password: userUpdate.newPassword })
    .expect("Content-Type", /json/)
    .expect({
      errors: [{ message: "Please sign in again and re-try that." }],
    })
    .expect(401);

  await logInAndDelete(user);
});

test("Delete User route fails when trying to delete another user's account", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);

  const loggedInUser = await logUserIn(user);

  await request(app)
    .delete(`/user/${loggedInUser.id - 1}`)
    .set("Authorization", `Bearer ${loggedInUser.token}`)
    .type("form")
    .send({ password: userUpdate.newPassword })
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        { message: "You have to be logged in to your account to access that." },
      ],
    })
    .expect(403);

  await deleteUser(loggedInUser);
});

test("Delete User route fails with no password entered", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);

  const loggedInUser = await logUserIn(user);

  await request(app)
    .delete(`/user/${user.id}`)
    .set("Authorization", `Bearer ${loggedInUser.token}`)
    .type("form")
    .send({ password: "" })
    .expect("Content-Type", /json/)
    .expect({
      errors: [
        { message: "You have to be logged in to your account to access that." },
      ],
    })
    .expect(403);

  await deleteUser(loggedInUser);
});

test("Delete User route fails with wrong password entered", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);

  const loggedInUser = await logUserIn(user);

  await request(app)
    .delete(`/user/${loggedInUser.id}`)
    .set("Authorization", `Bearer ${loggedInUser.token}`)
    .type("form")
    .send({ password: badPassword })
    .expect("Content-Type", /json/)
    .expect({ errors: [{ message: "The password you entered is incorrect." }] })
    .expect(403);

  await deleteUser(loggedInUser);
});

test("Delete User route succeeds with correct authHeader and correct password", async () => {
  const user = generateUserObject();
  user.id = await signUserUp(user);

  const loggedInUser = await logUserIn(user);

  await request(app)
    .delete(`/user/${loggedInUser.id}`)
    .set("Authorization", `Bearer ${loggedInUser.token}`)
    .type("form")
    .send({ password: loggedInUser.password })
    .expect("Content-Type", /json/)
    .expect({ message: "Account successfully deleted." })
    .expect(200);
});
