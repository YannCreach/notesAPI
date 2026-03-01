import Social from "../models/social.js";
import { supabaseAdmin } from "../database.js";
import { sendFriendRequestEmail, sendInvitationEmail } from "../services/email.js";
import { ApiError } from "../middleware/errorHandler.js";

class socialController {
  // POST /addfriend
  static async addFriend(req, res, next) {
    try {
      const userId = req.auth.payload.sub;
      const userEmail = req.auth.payload.email;
      const userName = req.auth.user?.user_metadata?.name || null;
      const { email } = req.body;

      if (!email) {
        throw new ApiError(400, "missing_email", "Email is required");
      }

      // Cannot add yourself
      if (email.toLowerCase() === userEmail.toLowerCase()) {
        throw new ApiError(400, "cannot_add_self", "Cannot add yourself");
      }

      // Look up target user by email
      const { data: usersData, error: listError } =
        await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw new Error(listError.message);

      const targetUser = usersData.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase(),
      );

      if (targetUser) {
        // Cas A — Le compte existe
        const targetId = targetUser.id;

        // Already friends?
        const existing = await Social.findFriendship(userId, targetId);
        if (existing) {
          throw new ApiError(409, "already_friends", "Already friends");
        }

        // Request already sent?
        const existingRequest = await Social.findFriendRequestByPair(
          userId,
          targetId,
        );
        if (existingRequest) {
          throw new ApiError(
            409,
            "request_exists",
            "Friend request already sent",
          );
        }

        // Create the friend request
        await Social.createFriendRequest(userId, targetId, userEmail, userName);

        // Send notification email (fire-and-forget)
        sendFriendRequestEmail(email, userName, userEmail).catch((err) =>
          console.error("[email] Failed to send friend request email:", err),
        );
      } else {
        // Cas B — Pas de compte : envoyer une invitation
        const existingInvitation = await Social.findPendingInvitation(
          userId,
          email.toLowerCase(),
        );
        if (!existingInvitation) {
          await Social.createPendingInvitation(
            userId,
            email.toLowerCase(),
            userEmail,
            userName,
          );
        }

        // Send invitation email (fire-and-forget)
        sendInvitationEmail(email, userName, userEmail).catch((err) =>
          console.error("[email] Failed to send invitation email:", err),
        );
      }

      // Always return 200 — never reveal whether the account exists
      res.status(200).json({ message: "Friend request sent" });
    } catch (error) {
      return next(error);
    }
  }

  // GET /friends
  static async getFriends(req, res, next) {
    try {
      const userId = req.auth.payload.sub;
      const friendRows = await Social.getFriends(userId);

      if (friendRows.length === 0) {
        return res.status(200).json([]);
      }

      // Fetch user info for each friend via admin API
      const { data: usersData, error: listError } =
        await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw new Error(listError.message);

      const usersMap = new Map(
        usersData.users.map((u) => [u.id, u]),
      );

      const friends = friendRows.map((row) => {
        const user = usersMap.get(row.friend_id);
        return {
          id: row.friend_id,
          email: user?.email || null,
          name: user?.user_metadata?.name || null,
          created_at: row.created_at,
        };
      });

      res.status(200).json(friends);
    } catch (error) {
      return next(error);
    }
  }

  // GET /friendrequests
  static async getFriendRequests(req, res, next) {
    try {
      const userId = req.auth.payload.sub;
      const requests = await Social.getPendingRequests(userId);
      res.status(200).json(requests);
    } catch (error) {
      return next(error);
    }
  }

  // PATCH /acceptfriend?id=<request_id>
  static async acceptFriend(req, res, next) {
    try {
      const userId = req.auth.payload.sub;
      const { id } = req.query;

      if (!id) {
        throw new ApiError(400, "missing_id", "Request id is required");
      }

      const request = await Social.findRequestById(id, userId);
      if (!request) {
        throw new ApiError(
          404,
          "request_not_found",
          "Friend request not found",
        );
      }

      // Create bidirectional friendship
      await Social.createFriendship(userId, request.from_user_id);

      // Delete the request
      await Social.deleteRequest(id, userId);

      res.status(200).json({ message: "Friend request accepted" });
    } catch (error) {
      return next(error);
    }
  }

  // DELETE /declinefriend?id=<request_id>
  static async declineFriend(req, res, next) {
    try {
      const userId = req.auth.payload.sub;
      const { id } = req.query;

      if (!id) {
        throw new ApiError(400, "missing_id", "Request id is required");
      }

      const request = await Social.findRequestById(id, userId);
      if (!request) {
        throw new ApiError(
          404,
          "request_not_found",
          "Friend request not found",
        );
      }

      await Social.deleteRequest(id, userId);

      res.status(200).json({ message: "Friend request declined" });
    } catch (error) {
      return next(error);
    }
  }

  // DELETE /removefriend?id=<friend_user_id>
  static async removeFriend(req, res, next) {
    try {
      const userId = req.auth.payload.sub;
      const { id } = req.query;

      if (!id) {
        throw new ApiError(400, "missing_id", "Friend id is required");
      }

      const deleted = await Social.removeFriend(userId, id);
      if (deleted.length === 0) {
        throw new ApiError(404, "friend_not_found", "Friend not found");
      }

      res.status(200).json({ message: "Friend removed" });
    } catch (error) {
      return next(error);
    }
  }

  // GET /friendplaces?userId=<friend_user_id>
  static async getFriendPlaces(req, res, next) {
    try {
      const userId = req.auth.payload.sub;
      const { userId: friendId } = req.query;

      // Verify friendship
      const friendship = await Social.findFriendship(userId, friendId);
      if (!friendship) {
        throw new ApiError(403, "not_friends", "Not friends with this user");
      }

      const places = await Social.getFriendPlaces(friendId);
      res.status(200).json(places);
    } catch (error) {
      return next(error);
    }
  }

  // GET /friendnotes?placeId=<place_id>&userId=<friend_user_id>
  static async getFriendNotes(req, res, next) {
    try {
      const userId = req.auth.payload.sub;
      const { placeId, userId: friendId } = req.query;

      // Verify friendship
      const friendship = await Social.findFriendship(userId, friendId);
      if (!friendship) {
        throw new ApiError(403, "not_friends", "Not friends with this user");
      }

      // Verify place belongs to friend
      const place = await Social.findPlaceByIdAndUser(placeId, friendId);
      if (!place) {
        throw new ApiError(404, "place_not_found", "Place not found");
      }

      const notes = await Social.getFriendNotes(placeId, friendId);
      res.status(200).json(notes);
    } catch (error) {
      return next(error);
    }
  }
}

export default socialController;
