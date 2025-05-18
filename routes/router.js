const { Router } = require("express");
const controller = require("../controllers/controller");
const router = Router();

router.get("/friend/:userId/", controller.listFriends);
router.post("/friend/:userId/add", controller.createFriend);

router.post("/user/login", controller.listUser);
router.post("/user/signup", controller.createUser);
router.delete("/user/:userId/delete", controller.deleteUser);

router.get("/message/:userId/:messageId", controller.listSingleMessage);
router.post("/message/:userId/thread/:threadId", controller.createMessage);

router.get("/thread/:userId", controller.listThreads);

router.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

module.exports = router;
