import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { supabaseAdmin } from "../database.js";
import { s3Client, s3Bucket } from "../s3.js";

/**
 * Account deletion.
 *
 * Deliberately server-side: removing the auth user requires the service role,
 * which never leaves the backend. The mobile app can only ask for it, and only
 * for the account behind its own bearer token.
 */

const bucketPrefix = () =>
  `https://${s3Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/`;

async function deleteS3FromUrl(url) {
  const prefix = bucketPrefix();
  if (!url || !url.startsWith(prefix)) return;
  try {
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: s3Bucket, Key: url.slice(prefix.length) }),
    );
  } catch (error) {
    // A missing or already-deleted object must not block the deletion.
    console.error("Failed to delete S3 object during account deletion:", error.message);
  }
}

class accountController {
  /**
   * Erase everything belonging to the caller, then the account itself.
   *
   * Order matters: photos are collected before their rows disappear, join
   * tables go before the rows they reference, and the auth user goes last so a
   * failure halfway still leaves an account able to retry.
   */
  static async deleteAccount(req, res, next) {
    try {
      const userId = req.auth.payload.sub;

      const [{ data: places }, { data: notes }] = await Promise.all([
        supabaseAdmin.from("place").select("id, cover").eq("user_id", userId),
        supabaseAdmin.from("note").select("id, cover").eq("user_id", userId),
      ]);

      const placeIds = (places || []).map((p) => p.id);
      const noteIds = (notes || []).map((n) => n.id);
      const covers = [...(places || []), ...(notes || [])]
        .map((row) => row.cover)
        .filter(Boolean);

      // Photos first: once the rows are gone their URLs are unrecoverable.
      for (const cover of covers) {
        await deleteS3FromUrl(cover);
      }

      if (noteIds.length) {
        await supabaseAdmin.from("note_has_tag").delete().in("note_id", noteIds);
      }
      if (placeIds.length) {
        await supabaseAdmin.from("place_has_tag").delete().in("place_id", placeIds);
      }

      await supabaseAdmin.from("note").delete().eq("user_id", userId);
      await supabaseAdmin.from("place").delete().eq("user_id", userId);
      await supabaseAdmin.from("category").delete().eq("user_id", userId);
      await supabaseAdmin.from("user_preferences").delete().eq("user_id", userId);

      // Social links point both ways: leaving the mirror rows would show a
      // ghost friend to the other person.
      await supabaseAdmin.from("friends").delete().eq("user_id", userId);
      await supabaseAdmin.from("friends").delete().eq("friend_id", userId);
      await supabaseAdmin.from("friend_requests").delete().eq("from_user_id", userId);
      await supabaseAdmin.from("friend_requests").delete().eq("to_user_id", userId);
      await supabaseAdmin.from("pending_invitations").delete().eq("from_user_id", userId);

      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        return res.status(500).json({
          error: {
            code: "account_deletion_failed",
            message: "Data was removed but the account could not be deleted",
          },
        });
      }

      return res.status(200).json({ deleted: true });
    } catch (error) {
      return next(error);
    }
  }
}

export default accountController;
