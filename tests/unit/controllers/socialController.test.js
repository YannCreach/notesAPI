import { describe, it, expect, vi, beforeEach } from "vitest";

const h = vi.hoisted(() => ({
  rpc: vi.fn(),
  sendFriendRequestEmail: vi.fn().mockResolvedValue(undefined),
  sendInvitationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../../app/database.js", () => ({
  supabaseAdmin: { rpc: h.rpc },
  supabase: {},
  default: {},
}));
vi.mock("../../../app/services/email.js", () => ({
  sendFriendRequestEmail: h.sendFriendRequestEmail,
  sendInvitationEmail: h.sendInvitationEmail,
}));
vi.mock("../../../app/models/social.js", () => ({
  default: {
    findFriendship: vi.fn(),
    findFriendRequestByPair: vi.fn(),
    createFriendRequest: vi.fn().mockResolvedValue(undefined),
    findPendingInvitation: vi.fn(),
    createPendingInvitation: vi.fn().mockResolvedValue(undefined),
    getFriends: vi.fn(),
    getPendingRequests: vi.fn(),
    findRequestById: vi.fn(),
    createFriendship: vi.fn().mockResolvedValue(undefined),
    deleteRequest: vi.fn().mockResolvedValue(undefined),
    removeFriend: vi.fn(),
    getFriendPlaces: vi.fn(),
    getPlacesForFriends: vi.fn(),
    getSharingTowards: vi.fn(),
    setFriendSettings: vi.fn(),
    findPlaceByIdAndUser: vi.fn(),
    getFriendNotes: vi.fn(),
  },
}));

import socialController from "../../../app/controllers/socialController.js";
import Social from "../../../app/models/social.js";

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (p) => ((res.body = p), res);
  return res;
}

function run(handler, req) {
  const res = mockRes();
  let err = null;
  return handler(req, res, (e) => (err = e)).then(() => ({ res, err }));
}

const baseAuth = {
  payload: { sub: "u1", email: "me@test.io" },
  user: { user_metadata: { name: "Me" } },
};

beforeEach(() => {
  vi.clearAllMocks();
  h.sendFriendRequestEmail.mockResolvedValue(undefined);
  h.sendInvitationEmail.mockResolvedValue(undefined);
});

describe("socialController.addFriend", () => {
  it("400 when email is missing", async () => {
    const { err } = await run(socialController.addFriend, { auth: baseAuth, body: {} });
    expect(err?.statusCode).toBe(400);
    expect(err?.code).toBe("missing_email");
  });

  it("400 when adding yourself (case-insensitive)", async () => {
    const { err } = await run(socialController.addFriend, {
      auth: baseAuth,
      body: { email: "ME@test.io" },
    });
    expect(err?.statusCode).toBe(400);
    expect(err?.code).toBe("cannot_add_self");
  });

  it("existing account: creates a request, sends email, returns 200", async () => {
    h.rpc.mockResolvedValue({ data: "target-id", error: null });
    Social.findFriendship.mockResolvedValue(null);
    Social.findFriendRequestByPair.mockResolvedValue(null);

    const { res, err } = await run(socialController.addFriend, {
      auth: baseAuth,
      body: { email: "friend@test.io" },
    });

    expect(err).toBeNull();
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Friend request sent" });
    expect(Social.createFriendRequest).toHaveBeenCalledWith(
      "u1", "target-id", "me@test.io", "Me",
    );
    expect(h.sendFriendRequestEmail).toHaveBeenCalled();
  });

  it("NON-existing account: same 200 body (never reveals account existence)", async () => {
    h.rpc.mockResolvedValue({ data: null, error: null });
    Social.findPendingInvitation.mockResolvedValue(null);

    const { res, err } = await run(socialController.addFriend, {
      auth: baseAuth,
      body: { email: "ghost@test.io" },
    });

    expect(err).toBeNull();
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Friend request sent" }); // identical to the existing-account case
    expect(Social.createPendingInvitation).toHaveBeenCalled();
    expect(h.sendInvitationEmail).toHaveBeenCalled();
  });

  it("non-existing account with a pending invitation: does not duplicate, still 200", async () => {
    h.rpc.mockResolvedValue({ data: null, error: null });
    Social.findPendingInvitation.mockResolvedValue({ id: 1 });

    const { res } = await run(socialController.addFriend, {
      auth: baseAuth,
      body: { email: "ghost@test.io" },
    });

    expect(res.statusCode).toBe(200);
    expect(Social.createPendingInvitation).not.toHaveBeenCalled();
    expect(h.sendInvitationEmail).toHaveBeenCalled();
  });

  it("409 when already friends", async () => {
    h.rpc.mockResolvedValue({ data: "target-id", error: null });
    Social.findFriendship.mockResolvedValue({ id: 1 });
    const { err } = await run(socialController.addFriend, {
      auth: baseAuth,
      body: { email: "friend@test.io" },
    });
    expect(err?.statusCode).toBe(409);
    expect(err?.code).toBe("already_friends");
  });

  it("409 when a request already exists", async () => {
    h.rpc.mockResolvedValue({ data: "target-id", error: null });
    Social.findFriendship.mockResolvedValue(null);
    Social.findFriendRequestByPair.mockResolvedValue({ id: 2 });
    const { err } = await run(socialController.addFriend, {
      auth: baseAuth,
      body: { email: "friend@test.io" },
    });
    expect(err?.statusCode).toBe(409);
    expect(err?.code).toBe("request_exists");
  });
});

describe("socialController.acceptFriend", () => {
  it("400 when id is missing", async () => {
    const { err } = await run(socialController.acceptFriend, { auth: baseAuth, query: {} });
    expect(err?.statusCode).toBe(400);
  });

  it("404 when the request does not belong to the user", async () => {
    Social.findRequestById.mockResolvedValue(null);
    const { err } = await run(socialController.acceptFriend, {
      auth: baseAuth,
      query: { id: "99" },
    });
    expect(err?.statusCode).toBe(404);
  });

  it("creates the friendship and deletes the request on success", async () => {
    Social.findRequestById.mockResolvedValue({ id: 5, from_user_id: "u9" });
    const { res } = await run(socialController.acceptFriend, {
      auth: baseAuth,
      query: { id: "5" },
    });
    expect(res.statusCode).toBe(200);
    expect(Social.createFriendship).toHaveBeenCalledWith("u1", "u9");
    expect(Social.deleteRequest).toHaveBeenCalledWith("5", "u1");
  });
});

describe("socialController.removeFriend", () => {
  it("404 when nothing was deleted", async () => {
    Social.removeFriend.mockResolvedValue([]);
    const { err } = await run(socialController.removeFriend, {
      auth: baseAuth,
      query: { id: "u2" },
    });
    expect(err?.statusCode).toBe(404);
  });

  it("200 when a friendship row was removed", async () => {
    Social.removeFriend.mockResolvedValue([{ id: 1 }]);
    const { res } = await run(socialController.removeFriend, {
      auth: baseAuth,
      query: { id: "u2" },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe("socialController.getFriendPlaces / getFriendNotes", () => {
  it("getFriendPlaces 403 when not friends", async () => {
    Social.findFriendship.mockResolvedValue(null);
    const { err } = await run(socialController.getFriendPlaces, {
      auth: baseAuth,
      query: { userId: "stranger" },
    });
    expect(err?.statusCode).toBe(403);
    expect(Social.getFriendPlaces).not.toHaveBeenCalled();
  });

  it("getFriendPlaces returns places when friends", async () => {
    Social.findFriendship.mockResolvedValue({ id: 1 });
    Social.getFriendPlaces.mockResolvedValue([{ id: 1 }]);
    const { res } = await run(socialController.getFriendPlaces, {
      auth: baseAuth,
      query: { userId: "friend1" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([{ id: 1 }]);
  });

  it("getFriendNotes 403 when not friends", async () => {
    Social.findFriendship.mockResolvedValue(null);
    const { err } = await run(socialController.getFriendNotes, {
      auth: baseAuth,
      query: { placeId: "1", userId: "stranger" },
    });
    expect(err?.statusCode).toBe(403);
  });

  it("getFriendNotes 404 when the place is not the friend's", async () => {
    Social.findFriendship.mockResolvedValue({ id: 1 });
    Social.findPlaceByIdAndUser.mockResolvedValue(null);
    const { err } = await run(socialController.getFriendNotes, {
      auth: baseAuth,
      query: { placeId: "1", userId: "friend1" },
    });
    expect(err?.statusCode).toBe(404);
  });

  it("getFriendNotes returns notes on the happy path", async () => {
    Social.findFriendship.mockResolvedValue({ id: 1 });
    Social.findPlaceByIdAndUser.mockResolvedValue({ id: 1 });
    Social.getFriendNotes.mockResolvedValue([{ id: 10 }]);
    const { res } = await run(socialController.getFriendNotes, {
      auth: baseAuth,
      query: { placeId: "1", userId: "friend1" },
    });
    expect(res.statusCode).toBe(200);
    // Le propriétaire voyage avec chaque memento : sur un lieu copié ils sont
    // mêlés à ceux de l'appelant et doivent dire de qui ils sont.
    expect(res.body).toEqual([{ id: 10, owner_id: "friend1", owner_name: null }]);
  });

  it("getFriendNotes labels the notes with the nickname you gave the friend", async () => {
    Social.findFriendship.mockResolvedValue({ id: 1, nickname: "Marie" });
    Social.findPlaceByIdAndUser.mockResolvedValue({ id: 1 });
    Social.getFriendNotes.mockResolvedValue([{ id: 10 }]);
    const { res } = await run(socialController.getFriendNotes, {
      auth: baseAuth,
      query: { placeId: "1", userId: "friend1" },
    });
    expect(res.body[0].owner_name).toBe("Marie");
  });
});

describe("socialController — partage des lieux entre amis", () => {
  it("getFriendPlaces 403 quand l'ami a coupé le partage", async () => {
    Social.findFriendship
      // Ma ligne : l'amitié existe bien.
      .mockResolvedValueOnce({ id: 1 })
      // La sienne, celle qui porte sa décision à mon égard.
      .mockResolvedValueOnce({ id: 2, share_places: false });
    const { err } = await run(socialController.getFriendPlaces, {
      auth: baseAuth,
      query: { userId: "friend1" },
    });
    expect(err?.statusCode).toBe(403);
    expect(err?.code).toBe("not_shared");
    expect(Social.getFriendPlaces).not.toHaveBeenCalled();
  });

  it("getFriendNotes 403 quand l'ami a coupé le partage", async () => {
    Social.findFriendship
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce({ id: 2, share_places: false });
    const { err } = await run(socialController.getFriendNotes, {
      auth: baseAuth,
      query: { placeId: "1", userId: "friend1" },
    });
    expect(err?.statusCode).toBe(403);
    expect(Social.getFriendNotes).not.toHaveBeenCalled();
  });

  it("une base pas encore migrée se comporte comme avant", async () => {
    // Colonne absente = `undefined`, et non `false` : le partage reste ouvert.
    Social.findFriendship.mockResolvedValue({ id: 1 });
    Social.getFriendPlaces.mockResolvedValue([{ id: 1 }]);
    const { res, err } = await run(socialController.getFriendPlaces, {
      auth: baseAuth,
      query: { userId: "friend1" },
    });
    expect(err).toBeNull();
    expect(res.statusCode).toBe(200);
  });

  it("getAllFriendsPlaces ne garde que les amis affichés qui partagent aussi", async () => {
    Social.getFriends.mockResolvedValue([
      { friend_id: "visible", nickname: "Marie", show_places: true },
      { friend_id: "masque", nickname: null, show_places: false },
      { friend_id: "discret", nickname: null, show_places: true },
    ]);
    Social.getSharingTowards.mockResolvedValue([
      { user_id: "visible", share_places: true },
      { user_id: "masque", share_places: true },
      { user_id: "discret", share_places: false },
    ]);
    Social.getPlacesForFriends.mockResolvedValue([{ id: 1, user_id: "visible" }]);
    h.rpc.mockResolvedValue({ data: [{ id: "visible", name: "Compte" }], error: null });

    const { res } = await run(socialController.getAllFriendsPlaces, { auth: baseAuth });

    // `masque` est ma décision, `discret` la sienne : les deux disparaissent.
    expect(Social.getPlacesForFriends).toHaveBeenCalledWith(["visible"]);
    // Et le surnom que je lui ai donné prime sur le nom de son compte.
    expect(res.body).toEqual([
      { id: 1, user_id: "visible", owner_id: "visible", owner_name: "Marie" },
    ]);
  });

  it("getAllFriendsPlaces répond [] sans interroger les lieux quand tout est coupé", async () => {
    Social.getFriends.mockResolvedValue([
      { friend_id: "discret", show_places: true },
    ]);
    Social.getSharingTowards.mockResolvedValue([
      { user_id: "discret", share_places: false },
    ]);
    const { res } = await run(socialController.getAllFriendsPlaces, { auth: baseAuth });
    expect(res.body).toEqual([]);
    expect(Social.getPlacesForFriends).not.toHaveBeenCalled();
  });

  it("setFriendSettings 400 quand le corps ne change rien", async () => {
    const { err } = await run(socialController.setFriendSettings, {
      auth: baseAuth,
      query: { id: "friend1" },
      body: {},
    });
    expect(err?.statusCode).toBe(400);
    expect(Social.setFriendSettings).not.toHaveBeenCalled();
  });

  it("setFriendSettings n'écrit que le drapeau envoyé", async () => {
    Social.setFriendSettings.mockResolvedValue({
      show_places: true,
      share_places: false,
    });
    const { res } = await run(socialController.setFriendSettings, {
      auth: baseAuth,
      query: { id: "friend1" },
      body: { share_places: false },
    });
    // `show_places` n'était pas dans le corps : il ne doit pas être réécrit.
    expect(Social.setFriendSettings).toHaveBeenCalledWith("u1", "friend1", {
      share_places: false,
    });
    expect(res.body).toEqual({
      id: "friend1",
      show_places: true,
      share_places: false,
    });
  });

  /**
   * Le filtre `is_private` vit dans les requêtes du modèle, pas dans le
   * contrôleur : ces cas-là verrouillent le contrat vu du contrôleur — un lieu
   * privé se comporte comme un lieu qui n'existe pas.
   */
  it("getFriendNotes 404 sur un lieu privé, sans révéler qu'il existe", async () => {
    Social.findFriendship.mockResolvedValue({ id: 1 });
    // Le modèle écarte les lignes privées : la recherche ne renvoie rien.
    Social.findPlaceByIdAndUser.mockResolvedValue(null);
    const { err } = await run(socialController.getFriendNotes, {
      auth: baseAuth,
      query: { placeId: "1", userId: "friend1" },
    });
    expect(err?.statusCode).toBe(404);
    expect(err?.code).toBe("place_not_found");
    expect(Social.getFriendNotes).not.toHaveBeenCalled();
  });

  it("setFriendSettings 404 quand l'amitié n'existe pas", async () => {
    Social.setFriendSettings.mockResolvedValue(null);
    const { err } = await run(socialController.setFriendSettings, {
      auth: baseAuth,
      query: { id: "stranger" },
      body: { show_places: false },
    });
    expect(err?.statusCode).toBe(404);
  });
});
