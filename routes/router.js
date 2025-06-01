const { Router } = require("express");
const router = Router();

const userController = require("../controllers/userController");
const security = require("../controllers/securityController");

router.post("/user", userController.createUser);
router.post("/user/login", userController.loginUser);
router.get("/user/:userId", security.verifyTokenValid, security.verifyTokenMatch, userController.getEmail);
/*
router.put("/user/:userId");
router.delete("/user/:userId");

router.post("/profile");
router.get("/profile/:profileId");
router.put("/profile/:profileId");
router.delete("/profile/:profileId");

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
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = router;
