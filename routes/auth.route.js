const express = require("express");
const {
  signupLimiter,
  loginLimiter,
  refreshLimiter,
} = require("../middleware/rateLimiter");

const { signup, login, logout, refresh } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/signup", signupLimiter, signup);

router.post("/login", loginLimiter, login);

router.post("/refresh", refreshLimiter, refresh);

router.post("/logout", logout);

module.exports = router;
