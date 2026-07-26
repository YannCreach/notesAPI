import { describe, it, expect } from "vitest";
import {
  LocationExistingQuerySchema,
  LocationAutoCompleteQuerySchema,
  PlaceDetailsQuerySchema,
  PlacePhotoQuerySchema,
  UploadPlacePhotoSchema,
} from "../../../app/validators/places.schemas.js";
import {
  AddFriendBodySchema,
  RequestIdQuerySchema,
  FriendPlacesQuerySchema,
  FriendNotesQuerySchema,
} from "../../../app/validators/social.schemas.js";

describe("places schemas", () => {
  it("LocationExisting requires a non-empty location", () => {
    expect(LocationExistingQuerySchema.safeParse({ location: "paris" }).success).toBe(true);
    expect(LocationExistingQuerySchema.safeParse({ location: "" }).success).toBe(false);
    expect(LocationExistingQuerySchema.safeParse({}).success).toBe(false);
  });

  it("LocationAutoComplete accepts optional lat/lng as string or number", () => {
    expect(
      LocationAutoCompleteQuerySchema.safeParse({ location: "x", lat: "1.2", lng: 3 }).success,
    ).toBe(true);
    expect(LocationAutoCompleteQuerySchema.safeParse({ location: "x" }).success).toBe(true);
    expect(LocationAutoCompleteQuerySchema.safeParse({ lat: "1" }).success).toBe(false);
  });

  it("PlaceDetails requires place_id", () => {
    expect(PlaceDetailsQuerySchema.safeParse({ place_id: "abc" }).success).toBe(true);
    expect(PlaceDetailsQuerySchema.safeParse({ place_id: "" }).success).toBe(false);
  });

  it("PlacePhoto requires photo_reference", () => {
    expect(PlacePhotoQuerySchema.safeParse({ photo_reference: "ref" }).success).toBe(true);
    expect(PlacePhotoQuerySchema.safeParse({ maxwidth: 400 }).success).toBe(false);
  });

  it("UploadPlacePhoto requires photo_reference + place_id and numeric maxwidth", () => {
    expect(
      UploadPlacePhotoSchema.safeParse({ photo_reference: "r", place_id: "p", maxwidth: 800 }).success,
    ).toBe(true);
    expect(
      UploadPlacePhotoSchema.safeParse({ photo_reference: "r", place_id: "p", maxwidth: "800" }).success,
    ).toBe(false);
    expect(UploadPlacePhotoSchema.safeParse({ photo_reference: "r" }).success).toBe(false);
  });
});

describe("social schemas", () => {
  it("AddFriend requires a valid email", () => {
    expect(AddFriendBodySchema.safeParse({ email: "a@b.io" }).success).toBe(true);
    expect(AddFriendBodySchema.safeParse({ email: "not-an-email" }).success).toBe(false);
    expect(AddFriendBodySchema.safeParse({}).success).toBe(false);
  });

  it("RequestId requires a non-empty id", () => {
    expect(RequestIdQuerySchema.safeParse({ id: "42" }).success).toBe(true);
    expect(RequestIdQuerySchema.safeParse({ id: "" }).success).toBe(false);
  });

  it("FriendPlaces requires userId", () => {
    expect(FriendPlacesQuerySchema.safeParse({ userId: "u1" }).success).toBe(true);
    expect(FriendPlacesQuerySchema.safeParse({}).success).toBe(false);
  });

  it("FriendNotes requires both placeId and userId", () => {
    expect(FriendNotesQuerySchema.safeParse({ placeId: "1", userId: "u1" }).success).toBe(true);
    expect(FriendNotesQuerySchema.safeParse({ placeId: "1" }).success).toBe(false);
  });
});
