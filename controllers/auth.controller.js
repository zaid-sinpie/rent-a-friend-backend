const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active.",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    const refreshToken = crypto.randomBytes(64).toString("hex");

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        expiresAt,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required.",
      });
    }

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    const session = await prisma.userSession.findUnique({
      where: {
        refreshTokenHash,
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

    if (session.expiresAt < new Date()) {
      await prisma.userSession.delete({
        where: {
          id: session.id,
        },
      });

      return res.status(401).json({
        success: false,
        message: "Refresh token has expired.",
      });
    }

    if (session.user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active.",
      });
    }

    const accessToken = jwt.sign(
      {
        id: session.user.id,
        email: session.user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully.",
      accessToken,
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required.",
      });
    }

    const refreshToken = authHeader.split(" ")[1];

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required.",
      });
    }

    const refreshTokenHash = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    await prisma.userSession.deleteMany({
      where: {
        refreshTokenHash,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
    });
  }
};

module.exports = {
  signup,
  login,
  refresh,
  logout,
};