const { Router } = require("express");
const router = Router();

const {
  checkThatBodyExists,
  checkThatParamsAreValid,
  sign,
  verifyTokenMatch,
  verifyTokenValid,
} = require("../controllers/securityController");

const commentController = require("../controllers/commentController");
const postController = require("../controllers/postController");
const profileController = require("../controllers/profileController");
const userController = require("../controllers/userController");

// user routes
router.post("/user", checkThatBodyExists, userController.createUser);
router.post("/user/login", checkThatBodyExists, userController.loginUser);
router.get(
  "/user/:userId",
  checkThatParamsAreValid,
  verifyTokenValid,
  verifyTokenMatch,
  userController.getEmail
);
router.put(
  "/user/:userId",
  checkThatBodyExists,
  checkThatParamsAreValid,
  verifyTokenValid,
  verifyTokenMatch,
  userController.updateUser
);
router.delete(
  "/user/:userId",
  checkThatBodyExists,
  checkThatParamsAreValid,
  verifyTokenValid,
  verifyTokenMatch,
  userController.deleteUser
);

// profile routes
router.post(
  "/profile",
  checkThatBodyExists,
  verifyTokenValid,
  profileController.createProfile
);
router.get(
  "/profile/:profileId",
  checkThatParamsAreValid,
  verifyTokenValid,
  profileController.readProfile
);
router.put(
  "/profile/:profileId",
  checkThatBodyExists,
  checkThatParamsAreValid,
  verifyTokenValid,
  verifyTokenMatch,
  profileController.updateProfile
);
router.delete(
  "/profile/:profileId",
  checkThatParamsAreValid,
  verifyTokenValid,
  verifyTokenMatch,
  profileController.deleteProfile
);

// post routes
router.post(
  "/post/:profileId",
  checkThatBodyExists,
  checkThatParamsAreValid,
  verifyTokenValid,
  verifyTokenMatch,
  postController.createPost
);
router.get(
  "/post/:postId",
  checkThatParamsAreValid,
  verifyTokenValid,
  postController.readPost
);
router.put(
  "/post/:postId",
  checkThatBodyExists,
  checkThatParamsAreValid,
  verifyTokenValid,
  verifyTokenMatch,
  postController.updatePost
);
router.delete(
  "/post/:postId",
  checkThatParamsAreValid,
  verifyTokenValid,
  verifyTokenMatch,
  postController.deletePost
);

// comment routes
router.post(
  "/comment/post/:postId/from/:profileId",
  checkThatBodyExists,
  checkThatParamsAreValid,
  verifyTokenValid,
  commentController.createComment
);
router.get(
  "/comment/post/:postId",
  checkThatParamsAreValid,
  verifyTokenValid,
  commentController.readComments
);
router.post(
  "/comment/reply/:commentId/from/:profileId",
  checkThatBodyExists,
  checkThatParamsAreValid,
  verifyTokenValid,
  commentController.createComment
);
router.get(
  "/comment/reply/:commentId",
  checkThatParamsAreValid,
  verifyTokenValid,
  commentController.readComments
);
router.put(
  "/comment/:commentId",
  checkThatBodyExists,
  checkThatParamsAreValid,
  verifyTokenValid,
  verifyTokenMatch,
  commentController.updateComment
);
router.delete(
  "/comment/:commentId",
  checkThatParamsAreValid,
  verifyTokenValid,
  verifyTokenMatch,
  commentController.deleteComment
);

/*
router.post("/follow/:profileId/from/:followerId");
router.get("/follow/profile/followers/:profileId");
router.get("/follow/profile/following/:profileId");
router.put("/follow/:followId");
router.delete("/follow/:followId");

router.post("/like/comment/:commentId/from/:profileId");
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
