import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

export async function signup(req, res) {
  // res.seond("Signup Route");
  const { fullName, email, password } = req.body;

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email already exists, please use a different one" });
    }

    const idx = Math.floor(Math.random() * 100) + 1; //generate random number between 1 and 100 (inclusive)
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    const newUser = await User.create({
      fullName,
      email,
      password,
      profilepic: randomAvatar, // Assigning a random avatar
    });

    // ************* CREATE THE USER IN STREAM AS WELL
    try {
      // Attempt to upsert the user in Stream
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilepic || "",
      });
      console.log(
        `User upserted in Stream successfully for ${newUser.fullName}`
      );
    } catch (error) {
      console.log("Error upserting user in Stream:", error);
    }

    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d", // Token will expire in 7 days
      }
    );

    res.cookie("jwt", token, {
      httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie will expire in 7 days
      sameSite: "Strict", // Helps prevent CSRF attacks
    });

    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.error("Error during signup:", error.message);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
}

export async function login(req, res) {
  // res.send("Login Route");

  try {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await user.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d", // Token will expire in 7 days
    });

    res.cookie("jwt", token, {
      httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie will expire in 7 days
      sameSite: "Strict", // Helps prevent CSRF attacks
    });

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error during login:", error.message);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
}

export function logout(req, res) {
  // res.send("Logout Route");
  res.clearCookie("jwt");
  res.status(200).json({ success: true, message: "Logged out successfully" });
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const { fullName, bio, nativeLanguage, learningLanguage, location } =
      req.body;
    // Check if all required fields are provided
    if (
      !fullName ||
      !bio ||
      !nativeLanguage ||
      !learningLanguage ||
      !location
    ) {
      return res.status(400).json({
        message: "Please fill all the fields",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }

    // Find the user by ID and update their profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        bio,
        nativeLanguage,
        learningLanguage,
        location,
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    // ******* TODO UPDATE THE STREAM USER PROFILE ********
    try {
      // Attempt to upsert the user in Stream
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilepic || "",
      });
      console.log(
        `User upserted in Stream successfully for ${updatedUser.fullName}`
      );
    } catch (streamError) {
      console.log("Error upserting user in Stream:", streamError);
    }

    res.status(200).json({
      success: true,
      message: "User onboarded successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
}
