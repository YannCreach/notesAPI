/**
 * Email template — Friend request notification
 * Sent to existing users when someone sends them a friend request.
 */

const BASE_URL = process.env.API_BASE_URL || "https://notes-api-pied.vercel.app";

export function friendRequestEmailHtml({ fromName, fromEmail }) {
  const senderDisplay = fromName || fromEmail;
  const senderSub = fromName ? fromEmail : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Nouvelle demande d'ami</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">

          <!-- Gradient header -->
          <tr>
            <td style="background:linear-gradient(135deg,#10b981 0%,#0891b2 100%);padding:36px 40px 32px;text-align:center;">
              <img src="${BASE_URL}/assets/logo_blanc.png" alt="Note To Myself" width="48" height="48" style="display:block;margin:0 auto 16px;border:0;outline:none;" />
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.8);">Note To Myself</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 12px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">Nouvelle demande d'ami</h1>
              <p style="margin:0;font-size:15px;color:#64748b;line-height:1.6;">Quelqu'un souhaite se connecter avec vous.</p>
            </td>
          </tr>

          <!-- Sender card -->
          <tr>
            <td style="padding:20px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <!-- Avatar circle -->
                        <td width="52" valign="top">
                          <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#10b981 0%,#0891b2 100%);text-align:center;line-height:48px;font-size:20px;font-weight:700;color:#ffffff;">
                            ${senderDisplay.charAt(0).toUpperCase()}
                          </div>
                        </td>
                        <td style="padding-left:16px;vertical-align:middle;">
                          <p style="margin:0;font-size:16px;font-weight:600;color:#0f172a;line-height:1.3;">${senderDisplay}</p>
                          ${senderSub ? `<p style="margin:4px 0 0;font-size:13px;color:#94a3b8;line-height:1.3;">${senderSub}</p>` : ""}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:12px 40px 8px;text-align:center;">
              <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6;">Ouvrez l'application pour accepter ou d&eacute;cliner cette demande.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:10px;background:linear-gradient(135deg,#10b981 0%,#0891b2 100%);">
                    <a href="#" target="_blank" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                      Ouvrir Note To Myself
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider + footer -->
          <tr>
            <td style="padding:32px 40px 0;">
              <div style="height:1px;background-color:#e2e8f0;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                Vous recevez cet email car quelqu'un vous a envoy&eacute; une demande d'ami sur Note To Myself.<br/>
                Si vous ne connaissez pas cette personne, vous pouvez ignorer ce message.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

        <!-- Sub-footer -->
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">
          <tr>
            <td style="padding:24px 16px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                &copy; ${new Date().getFullYear()} Note To Myself
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}
