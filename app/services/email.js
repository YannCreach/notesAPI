import { Resend } from "resend";
import { friendRequestEmailHtml } from "../templates/friendRequestEmail.js";
import { invitationEmailHtml } from "../templates/invitationEmail.js";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const fromAddress = process.env.RESEND_FROM_EMAIL || "contact@misaia.dev";

export async function sendFriendRequestEmail(toEmail, fromName, fromEmail) {
  if (!resend) {
    console.log(
      `[email] Resend not configured — skipping notification to ${toEmail} from ${fromName} (${fromEmail})`,
    );
    return;
  }

  await resend.emails.send({
    from: fromAddress,
    to: toEmail,
    subject: "Nouvelle demande d'ami sur Note To Myself",
    html: friendRequestEmailHtml({ fromName, fromEmail }),
  });
}

export async function sendInvitationEmail(toEmail, fromName, fromEmail) {
  if (!resend) {
    console.log(
      `[email] Resend not configured — skipping invitation to ${toEmail} from ${fromName} (${fromEmail})`,
    );
    return;
  }

  await resend.emails.send({
    from: fromAddress,
    to: toEmail,
    subject: "Vous êtes invité sur Note To Myself",
    html: invitationEmailHtml({ fromName, fromEmail }),
  });
}
