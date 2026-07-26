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
    expect(res.body).toEqual([{ id: 10 }]);
  });
});
