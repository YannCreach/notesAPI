# Supabase Email Templates

Templates HTML pour les emails Supabase (Authentication > Email Templates).
Utilise les variables Supabase : `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`, `{{ .Token }}`, etc.

---

## 1. Confirm Signup

**Subject :** `Confirmez votre inscription sur Note To Myself`

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Confirmez votre inscription</title>
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
  <body
    style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"
  >
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="background-color:#f1f5f9;"
    >
      <tr>
        <td align="center" style="padding:40px 16px;">
          <!-- Card -->
          <table
            role="presentation"
            width="520"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="max-width:520px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);"
          >
            <!-- Gradient header -->
            <tr>
              <td
                style="background:linear-gradient(135deg,#10b981 0%,#0891b2 100%);padding:36px 40px 32px;text-align:center;"
              >
                <img
                  src="https://notes-api-pied.vercel.app/assets/logo_ntm1.png"
                  alt="Note To Myself"
                  width="96"
                  height="96"
                  style="display:block;margin:0 auto 16px;border:0;outline:none;"
                />
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:36px 40px 12px;">
                <h1
                  style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;"
                >
                  Bienvenue sur Note To Myself
                </h1>
                <p
                  style="margin:0;font-size:15px;color:#64748b;line-height:1.6;"
                >
                  Merci de vous &ecirc;tre inscrit. Confirmez votre adresse
                  email pour commencer &agrave; sauvegarder vos lieux et
                  m&eacute;mentos.
                </p>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td style="padding:28px 40px 8px;text-align:center;">
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="margin:0 auto;"
                >
                  <tr>
                    <td
                      style="border-radius:10px;background:linear-gradient(135deg,#10b981 0%,#0891b2 100%);"
                    >
                      <a
                        href="{{ .ConfirmationURL }}"
                        target="_blank"
                        style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;"
                      >
                        Confirmer mon email
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Fallback link -->
            <tr>
              <td style="padding:16px 40px 0;text-align:center;">
                <p
                  style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;"
                >
                  Si le bouton ne fonctionne pas, copiez ce lien dans votre
                  navigateur&nbsp;:
                </p>
                <p
                  style="margin:8px 0 0;font-size:11px;color:#10b981;word-break:break-all;line-height:1.5;"
                >
                  {{ .ConfirmationURL }}
                </p>
              </td>
            </tr>

            <!-- Divider + footer -->
            <tr>
              <td style="padding:28px 40px 0;">
                <div style="height:1px;background-color:#e2e8f0;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px 32px;text-align:center;">
                <p
                  style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;"
                >
                  Si vous n'avez pas cr&eacute;&eacute; de compte, vous pouvez
                  ignorer cet email.
                </p>
              </td>
            </tr>
          </table>

          <!-- Sub-footer -->
          <table
            role="presentation"
            width="520"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="max-width:520px;width:100%;"
          >
            <tr>
              <td style="padding:24px 16px;text-align:center;">
                <p style="margin:0;font-size:11px;color:#94a3b8;">
                  &copy; 2025 Note To Myself
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

---

## 2. Reset Password

**Subject :** `R&eacute;initialisez votre mot de passe — Note To Myself`

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>R&eacute;initialisation du mot de passe</title>
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
  <body
    style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;"
  >
    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      style="background-color:#f1f5f9;"
    >
      <tr>
        <td align="center" style="padding:40px 16px;">
          <!-- Card -->
          <table
            role="presentation"
            width="520"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="max-width:520px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);"
          >
            <!-- Gradient header -->
            <tr>
              <td
                style="background:linear-gradient(135deg,#10b981 0%,#0891b2 100%);padding:36px 40px 32px;text-align:center;"
              >
                <img
                  src="https://notes-api-pied.vercel.app/assets/logo_ntm1.png"
                  alt="Note To Myself"
                  width="96"
                  height="96"
                  style="display:block;margin:0 auto 16px;border:0;outline:none;"
                />
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:36px 40px 12px;">
                <h1
                  style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;"
                >
                  R&eacute;initialisation du mot de passe
                </h1>
                <p
                  style="margin:0;font-size:15px;color:#64748b;line-height:1.6;"
                >
                  Vous avez demand&eacute; &agrave; r&eacute;initialiser votre
                  mot de passe. Cliquez sur le bouton ci-dessous pour en choisir
                  un nouveau.
                </p>
              </td>
            </tr>

            <!-- CTA -->
            <tr>
              <td style="padding:28px 40px 8px;text-align:center;">
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  style="margin:0 auto;"
                >
                  <tr>
                    <td
                      style="border-radius:10px;background:linear-gradient(135deg,#10b981 0%,#0891b2 100%);"
                    >
                      <a
                        href="{{ .ConfirmationURL }}"
                        target="_blank"
                        style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;"
                      >
                        Choisir un nouveau mot de passe
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Fallback link -->
            <tr>
              <td style="padding:16px 40px 0;text-align:center;">
                <p
                  style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;"
                >
                  Si le bouton ne fonctionne pas, copiez ce lien dans votre
                  navigateur&nbsp;:
                </p>
                <p
                  style="margin:8px 0 0;font-size:11px;color:#10b981;word-break:break-all;line-height:1.5;"
                >
                  {{ .ConfirmationURL }}
                </p>
              </td>
            </tr>

            <!-- Divider + footer -->
            <tr>
              <td style="padding:28px 40px 0;">
                <div style="height:1px;background-color:#e2e8f0;"></div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px 32px;text-align:center;">
                <p
                  style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;"
                >
                  Si vous n'avez pas demand&eacute; cette
                  r&eacute;initialisation, vous pouvez ignorer cet email.<br />
                  Votre mot de passe restera inchang&eacute;.
                </p>
              </td>
            </tr>
          </table>

          <!-- Sub-footer -->
          <table
            role="presentation"
            width="520"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="max-width:520px;width:100%;"
          >
            <tr>
              <td style="padding:24px 16px;text-align:center;">
                <p style="margin:0;font-size:11px;color:#94a3b8;">
                  &copy; 2025 Note To Myself
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```
