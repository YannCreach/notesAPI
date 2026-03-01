import { supabaseAdmin as supabase } from "../database.js";

class Social {
  // --- Friend requests ---

  static async findFriendRequestByPair(fromUserId, toUserId) {
    const { data, error } = await supabase
      .from("friend_requests")
      .select("id")
      .eq("from_user_id", fromUserId)
      .eq("to_user_id", toUserId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  static async createFriendRequest(fromUserId, toUserId, fromEmail, fromName) {
    const { error } = await supabase.from("friend_requests").insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      from_email: fromEmail,
      from_name: fromName,
    });
    if (error) throw new Error(error.message);
  }

  static async getPendingRequests(userId) {
    const { data, error } = await supabase
      .from("friend_requests")
      .select("id, from_email, from_name, created_at")
      .eq("to_user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  static async findRequestById(requestId, toUserId) {
    const { data, error } = await supabase
      .from("friend_requests")
      .select("id, from_user_id, to_user_id")
      .eq("id", requestId)
      .eq("to_user_id", toUserId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  static async deleteRequest(requestId, toUserId) {
    const { error } = await supabase
      .from("friend_requests")
      .delete()
      .eq("id", requestId)
      .eq("to_user_id", toUserId);
    if (error) throw new Error(error.message);
  }

  // --- Friends ---

  static async findFriendship(userId, friendId) {
    const { data, error } = await supabase
      .from("friends")
      .select("id")
      .eq("user_id", userId)
      .eq("friend_id", friendId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  static async createFriendship(userId, friendId) {
    const { error } = await supabase.from("friends").insert([
      { user_id: userId, friend_id: friendId },
      { user_id: friendId, friend_id: userId },
    ]);
    if (error) throw new Error(error.message);
  }

  static async getFriends(userId) {
    const { data, error } = await supabase
      .from("friends")
      .select("friend_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  static async removeFriend(userId, friendId) {
    // Delete both directions
    const { data, error } = await supabase
      .from("friends")
      .delete()
      .or(
        `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`,
      )
      .select("id");
    if (error) throw new Error(error.message);
    return data || [];
  }

  // --- Friend data (places & notes) ---

  static async getFriendPlaces(friendUserId) {
    const { data, error } = await supabase
      .from("place")
      .select(
        "id, name, address, city, latitude, longitude, cover, rating, favorite, category_id, created_at, updated_at, notes_count:note(count)",
      )
      .eq("user_id", friendUserId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    // Flatten the notes_count from [{count: N}] to N
    return (data || []).map((place) => ({
      ...place,
      notes_count: place.notes_count?.[0]?.count ?? 0,
    }));
  }

  static async getFriendNotes(placeId, friendUserId) {
    const { data, error } = await supabase
      .from("note")
      .select(
        "id, place_id, name, comment, price, rating, cover, favorite, created_at, updated_at",
      )
      .eq("place_id", placeId)
      .eq("user_id", friendUserId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  // --- Pending invitations ---

  static async findPendingInvitation(fromUserId, toEmail) {
    const { data, error } = await supabase
      .from("pending_invitations")
      .select("id")
      .eq("from_user_id", fromUserId)
      .eq("to_email", toEmail)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  static async createPendingInvitation(fromUserId, toEmail, fromEmail, fromName) {
    const { error } = await supabase.from("pending_invitations").insert({
      from_user_id: fromUserId,
      to_email: toEmail,
      from_email: fromEmail,
      from_name: fromName,
    });
    if (error) throw new Error(error.message);
  }

  static async convertPendingInvitations(newUserEmail, newUserId) {
    // Find all pending invitations for this email
    const { data: invitations, error: fetchError } = await supabase
      .from("pending_invitations")
      .select("id, from_user_id, from_email, from_name")
      .eq("to_email", newUserEmail);
    if (fetchError) throw new Error(fetchError.message);
    if (!invitations || invitations.length === 0) return [];

    // Convert each invitation to a friend_request
    const friendRequests = invitations.map((inv) => ({
      from_user_id: inv.from_user_id,
      to_user_id: newUserId,
      from_email: inv.from_email,
      from_name: inv.from_name,
    }));

    const { error: insertError } = await supabase
      .from("friend_requests")
      .insert(friendRequests);
    if (insertError) throw new Error(insertError.message);

    // Delete converted invitations
    const ids = invitations.map((inv) => inv.id);
    const { error: deleteError } = await supabase
      .from("pending_invitations")
      .delete()
      .in("id", ids);
    if (deleteError) throw new Error(deleteError.message);

    return invitations;
  }

  // --- Friend data (places & notes) ---

  static async findPlaceByIdAndUser(placeId, userId) {
    const { data, error } = await supabase
      .from("place")
      .select("id")
      .eq("id", placeId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }
}

export default Social;
