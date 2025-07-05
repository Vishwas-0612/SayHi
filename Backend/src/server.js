import express from "express";
import "dotenv/config"; //beow two line is same as import dotenv from "dotenv"; dotenv.config();
// Importing dotenv to manage environment variables
//import dotenv from "dotenv";
//dotenv.config(); //To be able to use environment variables from .env file
import cookieParser from "cookie-parser"; // ADD THIS
import { connectDB } from "./lib/db.js"; // Importing the database connection function
import cors from "cors"; // Importing CORS middleware to handle cross-origin requests
import path from "path"; // Importing path module to handle file paths

import authRoutes from "./routes/auth.route.js"; // Importing the auth routes from the auth.route.js file
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js"; // Importing the chat routes from the chat.route.js file

const app = express();
app.use(cookieParser());
const PORT = process.env.PORT || 5001;

const __dirname = path.resolve(); // Get the current directory name
// Noob Method
// app.get("/api/auth/signup", (req, res) => {
//   res.send("Signup Route");
// });
// app.get("/api/auth/login", (req, res) => {
//   res.send("Login Route");
// });
// app.get("/api/auth/logout", (req, res) => {
//   res.send("Logout Route");
// });
app.use(
  cors({
    origin: "http://localhost:5173", // Allow requests from this origin
    credentials: true, // Allow cookies to be sent with requests by frontend
  })
); // Middleware to enable CORS

app.use(express.json()); // Middleware to parse JSON bodies

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

if (process.env.NODE_ENV === "production") {
  // Serve static files from the React frontend app
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  // Handle React routing, return all requests to React app
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
