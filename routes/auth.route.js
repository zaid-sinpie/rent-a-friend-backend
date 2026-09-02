const express = require("express");
const { signupLimiter, loginLimiter } = require("../middleware/rateLimiter");

const {signup, login, logout} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/signup", signupLimiter, signup);

router.post("/login", loginLimiter, login);

router.post("/logout", logout);

module.exports = router;