const { Router } = require("express");
const router = Router();

const userController = require("../controllers/userController");
const security = require("../controllers/securityController");

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
  security.verifyTokenValid
);
router.get("/profile/:profileId", security.verifyTokenValid);
router.put(
  "/profile/:profileId",
  security.checkThatBodyExists,
  security.verifyTokenValid,
  security.verifyTokenMatch
);
router.delete(
  "/profile/:profileId",
  security.verifyTokenValid,
  security.verifyTokenMatch
);

/*
router.post("/post");
router.get("/post/:postId");
router.put("/post/:postId");
router.delete("/post/:postId");

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
  res.status(404).json({ error: "Route not found" });
});

router.use((err, req, res, next) => {
  console.error(err.stack);
  console.log(req.body);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = router;
