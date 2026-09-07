const express = require("express");

const userController = require("../controllers/user.controller");

const router = express.Router();

router.get("/", getUsersLimiter, userController.getUsers);

router.get("/:id", getUserLimiter, userController.getUser);

router.put("/:id", updateUserLimiter, userController.updateUser);

router.delete("/:id", deleteUserLimiter, userController.deleteUser);

module.exports = router;