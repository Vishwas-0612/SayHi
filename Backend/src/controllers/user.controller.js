import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // Exclude current user
        { _id: { $nin: currentUser.friends } }, // Exclude friends
        { isOnboarded: true }, // Only onboarded users
      ],
    });
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error fetching recommended users:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate(
        "friends",
        "fullName profilepic nativeLanguage learningLanguage"
      );

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getMyFriends controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    // prevent sending friend request to self
    if (myId === recipientId) {
      return res
        .status(400)
        .json({ message: "You cannot send a friend request to yourself." });
    }

    // check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found." });
    }
    // check if recipient is already a friend
    if (recipient.friends.includes(myId)) {
      console.log("Already friends");
      return res
        .status(400)
        .json({ message: "You are already friends with this user." });
    }

    //check if friend request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });
    if (existingRequest) {
      return res.status(400).json({
        message: "Friend request already exists between you and this user.",
      });
    }

    // create a new friend request
    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error sending friend request:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found." });
    }

    // Verify if the current user is the recipient of the request
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to accept this request." });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // Add each other to friends list
    // $addToSet :  adds elements to an array only if they do not already exist in the array
    await User.findByIdAndUpdate(
      friendRequest.sender,
      {
        $addToSet: { friends: friendRequest.recipient },
      }
      // { new: true }
    );

    await User.findByIdAndUpdate(
      friendRequest.recipient,
      {
        $addToSet: { friends: friendRequest.sender },
      }
      // { new: true }
    );

    res.status(200).json({ message: "Friend request accepted successfully." });
  } catch (error) {
    console.error("Error accepting friend request:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingRequests = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate(
      "sender",
      "fullName profilepic nativeLanguage learningLanguage"
    );

    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilepic ");

    res.status(200).json({
      incomingRequests,
      acceptedReqs,
    });
  } catch (error) {
    console.error(
      "Error in getPendingFriendRequests controller:",
      error.message
    );
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getOutgoingFriendRequests(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate(
      "recipient",
      "fullName profilepic nativeLanguage learningLanguage"
    );
    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.error(
      "Error in getOutgoingFriendRequests controller:",
      error.message
    );
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
