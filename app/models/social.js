import { supabaseAdmin as supabase } from "../database.js";

/**
 * Les `category_id` sont propres à chaque compte : celui d'un ami ne désigne
 * rien chez vous, et pointerait par hasard sur une de vos catégories. Le lieu
 * voyage donc avec le libellé et l'icône de sa propre catégorie, et on retire
 * l'objet imbriqué que PostgREST renvoie.
 */
function flattenCategory(place) {
  const { category, ...rest } = place;
  return {
    ...rest,
    category_label: category?.label ?? null,
    category_icon: category?.icon ?? null,
  };
}

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

  /**
   * La ligne `(userId → friendId)`, celle qui appartient à `userId`.
   *
   * Elle sert à deux choses opposées selon le sens dans lequel on l'interroge :
   * dans le sens direct elle prouve l'amitié et porte le surnom ; dans le sens
   * inverse — `findFriendship(ami, moi)` — elle dit si cet ami m'autorise à
   * voir ses lieux (`share_places`), puisque c'est lui qui a écrit cette
   * ligne-là.
   */
  static async findFriendship(userId, friendId) {
    const { data, error } = await supabase
      .from("friends")
      .select("id, nickname, show_places, share_places")
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
      .select("friend_id, created_at, nickname, show_places, share_places")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Les lignes que mes amis ont écrites **vers moi**, donc leur `share_places`
   * à mon égard. `getFriends` ne peut pas y répondre : elle lit mes lignes à
   * moi, où ce drapeau décrit ce que *je* partage.
   *
   * Une requête pour tout le monde, parce que la carte les demande d'un coup.
   */
  static async getSharingTowards(userId) {
    const { data, error } = await supabase
      .from("friends")
      .select("user_id, share_places")
      .eq("friend_id", userId);
    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Réglages par ami. Comme le surnom, n'écrit que la ligne dont l'appelant est
   * propriétaire : `share_places` se décide chez soi, jamais chez l'autre.
   */
  static async setFriendSettings(userId, friendId, patch) {
    const { data, error } = await supabase
      .from("friends")
      .update(patch)
      .eq("user_id", userId)
      .eq("friend_id", friendId)
      .select("show_places, share_places");
    if (error) throw new Error(error.message);
    return (data || [])[0] || null;
  }

  /**
   * Les lieux de plusieurs amis en une requête. L'accueil affiche les pins de
   * tout le monde : les chercher un ami à la fois ferait autant d'allers-retours
   * que d'amis au lancement de l'écran.
   *
   * `user_id` est renvoyé pour pouvoir attribuer chaque lieu à son propriétaire.
   */
  static async getPlacesForFriends(friendIds) {
    if (!friendIds.length) return [];
    const { data, error } = await supabase
      .from("place")
      .select(
        "id, name, address, city, latitude, longitude, cover, rating, user_id, category:category_id(label, icon)",
      )
      .in("user_id", friendIds)
      // Un lieu privé n'apparaît sur aucune carte d'ami. Le filtre est ici et
      // non dans l'app : c'est le serveur qui décide de ce qu'il sert.
      .eq("is_private", false)
      .not("latitude", "is", null)
      .not("longitude", "is", null);
    if (error) throw new Error(error.message);
    return (data || []).map(flattenCategory);
  }

  /**
   * Surnom local. N'écrit que la ligne dont l'appelant est propriétaire, donc
   * l'autre côté de l'amitié n'est jamais touché — et l'autre n'a aucun moyen
   * de savoir comment vous l'avez enregistré. `null` efface le surnom.
   */
  static async setFriendNickname(userId, friendId, nickname) {
    const { data, error } = await supabase
      .from("friends")
      .update({ nickname })
      .eq("user_id", userId)
      .eq("friend_id", friendId)
      .select("friend_id");
    if (error) throw new Error(error.message);
    return (data || []).length > 0;
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
        "id, name, address, city, latitude, longitude, cover, rating, favorite, category_id, created_at, updated_at, notes_count:note(count), category:category_id(label, icon)",
      )
      .eq("user_id", friendUserId)
      // Idem sur son profil : privé veut dire privé, y compris quand on vient
      // regarder son carnet exprès.
      .eq("is_private", false)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    // Flatten the notes_count from [{count: N}] to N
    return (data || []).map((place) => ({
      ...flattenCategory(place),
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

  /**
   * Le lieu d'un ami, pour autoriser la lecture de ses mementos.
   *
   * Les lieux privés en sont exclus : ils répondent donc « introuvable » plutôt
   * que « interdit ». C'est volontaire — un refus explicite confirmerait à
   * l'ami que le lieu existe, ce qui est précisément ce qu'on lui cache. Et ça
   * couvre aussi le lieu qu'il a **copié** avant : sa copie reste la sienne,
   * mais les mementos qu'il y lisait disparaissent.
   */
  static async findPlaceByIdAndUser(placeId, userId) {
    const { data, error } = await supabase
      .from("place")
      .select("id")
      .eq("id", placeId)
      .eq("user_id", userId)
      .eq("is_private", false)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }
}

export default Social;
