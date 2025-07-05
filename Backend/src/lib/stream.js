import { StreamChat } from "stream-chat";
import "dotenv/config";

const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

if (!apiKey || !apiSecret) {
  console.log("Stream API key or Secret is missing.");
}

const streamClient = StreamChat.getInstance(apiKey, apiSecret);

// upsertcreateStreamUser function to create or update a user in Stream
/**
 * Upserts a user in Stream.
 * If the user already exists, it updates the user data.
 * If the user does not exist, it creates a new user.
 */
export const upsertStreamUser = async (userData) => {
  try {
    await streamClient.upsertUsers([userData]);
    return userData;
  } catch (error) {
    console.error("Error in upserting Stream user:", error);
  }
};

// ************** Importing the StreamChat SDK and initializing the client
// This function generates a Stream token for a user based on their userId.
export const generateStreamToken = (userId) => {
  try {
    // ensure userId is a string
    const userIdStr = userId.toString();
    return streamClient.createToken(userIdStr);
  } catch (error) {
    console.error("Error generating Stream token:", error);
    throw error; // rethrow the error for further handling
  }
};

// This code do take the user data and save/upsert it in Stream's database.
// It uses the StreamChat SDK to interact with the Stream service.
// The function `upsertcreateStreamUser` checks if the user exists in Stream and either updates or creates the user accordingly.
