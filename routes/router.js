const { Router } = require("express");
const router = Router();

const security = require("../controllers/securityController");

const postController = require("../controllers/postController");
const profileController = require("../controllers/profileController");
const userController = require("../controllers/userController");

router.post("/user", security.checkThatBodyExists, userController.createUser);
router.post(
  "/user/login",
  security.checkThatBodyExists,
  userController.loginUser
);
router.get(
  "/user/:userId",
  security.verifyTokenValid,
  security.verifyTokenMatch,
  userController.getEmail
);
router.put(
  "/user/:userId",
  security.checkThatBodyExists,
  security.verifyTokenValid,
  security.verifyTokenMatch,
  userController.updateUser
);
router.delete(
  "/user/:userId",
  security.checkThatBodyExists,
  security.verifyTokenValid,
  security.verifyTokenMatch,
  userController.deleteUser
);

router.post(
  "/profile",
  security.checkThatBodyExists,
  security.verifyTokenValid,
  profileController.createProfile
);
router.get(
  "/profile/:profileId",
  security.verifyTokenValid,
  profileController.readProfile
);
router.put(
  "/profile/:profileId",
  security.checkThatBodyExists,
  security.verifyTokenValid,
  security.verifyTokenMatch,
  profileController.updateProfile
);
router.delete(
  "/profile/:profileId",
  security.verifyTokenValid,
  security.verifyTokenMatch,
  profileController.deleteProfile
);

router.post(
  "/post/:profileId",
  security.checkThatBodyExists,
  security.verifyTokenValid,
  security.verifyTokenMatch,
  postController.createPost
);
router.get("/post/:postId", security.verifyTokenValid, postController.readPost);
router.put(
  "/post/:postId",
  security.checkThatBodyExists,
  security.verifyTokenValid,
  security.verifyTokenMatch,
  postController.updatePost
);
router.delete(
  "/post/:postId",
  security.verifyTokenValid,
  security.verifyTokenMatch,
  postController.deletePost
);

/*
router.get("/comment/post/:postId");
router.post("/comment/post/:postId");
router.get("/comment/reply/:commentId");
router.post("/comment/reply/:commentId");
router.put("/comment/self/:commentId");
router.delete("/comment/self/:commentId");

router.post("/follow");
router.get("/follow/profile/followers/:profileId");
router.get("/follow/profile/following/:profileId");
router.put("/follow/:followId");
router.delete("/follow/:followId");

router.post("/like/comment/:commentId");
router.post("/like/post/:postId");
router.delete("/like/:likeId");
*/

router.use((req, res) => {
  const errorObject = {
    errors: [
      {
        message: "Route not found",
      },
    ],
  };
  res.status(404).json(errorObject);
});

router.use((err, req, res, next) => {
  const errorObject = {
    errors: [
      {
        message: "Internal Server Error",
      },
    ],
  };
  console.error(err.stack);
  res.status(500).json(errorObject);
});

module.exports = router;
