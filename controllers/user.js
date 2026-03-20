const User = require("../models/user");

// Email validation function
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function handleUserSignUp(req, res) {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Note: In production, passwords should be hashed using bcrypt
    // For now, storing as-is (consider using bcrypt for security)
    await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password, // WARNING: Passwords should be hashed in production
    });

    return res.redirect("/login");
  } catch (error) {
    console.error("Signup error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }
    return res.status(500).json({ error: "Signup failed, please try again" });
  }
}

async function handleUserLogin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      password,
    });

    if (!user) {
      return res.render("login", {
        error: "Invalid Email or Password",
      });
    }

    // TODO: Implement sessions/JWT for proper authentication
    return res.redirect("/");
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed, please try again" });
  }
}

module.exports = {
  handleUserSignUp,
  handleUserLogin,
};
