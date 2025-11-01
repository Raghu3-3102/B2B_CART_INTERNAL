export const SendOtpMailContent = (otp,role)=>{
    return ( `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="min-width:100%;background:#f4f7fb;padding:32px 0;">
    <tr>
      <td align="center">
        <!-- Card container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:linear-gradient(180deg,#0b2b5a,#083057);border-radius:12px;box-shadow:0 8px 30px rgba(3,13,36,0.15);overflow:hidden;">
          
          <!-- Header: EQES -->
          <tr>
            <td style="padding:28px 32px 12px 32px;text-align:center;">
              <div style="font-weight:800;font-size:28px;color:#ffffff;letter-spacing:1px;">EQCAS</div>
              <div style="margin-top:6px;color:rgba(255,255,255,0.85);font-size:13px;">Secure access & identity</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:22px 32px 28px 32px;color:#e6eefc;">
              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.5;color:#e6eefc;">
                Hi <strong>${role}</strong>,
              </p>

              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.5;color:#d7e8ff;">
                We received a request to reset the password for your EQES account. Use the one-time PIN (OTP) below to continue. This code is valid for <strong>10 minutes</strong>.
              </p>

              <!-- OTP box -->
              <div style="margin:18px 0 22px 0;padding:14px 18px;background:rgba(255,255,255,0.06);border-radius:10px;display:inline-block;">
                <span style="display:block;font-size:20px;letter-spacing:4px;text-align:center;font-weight:700;color:#ffffff;">
                  ${otp}
                </span>
              </div>


              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.78);line-height:1.4;">
                If you did not request this change, please ignore this email or contact your administrator immediately. For security, never share your OTP with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 32px;background:#061a36;color:rgba(255,255,255,0.6);font-size:12px;text-align:center;">
              © <strong>EQES</strong> — Securing your access. If you need help, contact support at support@eqes.example
            </td>
          </tr>
        </table>
        <!-- End card -->
      </td>
    </tr>
  </table>
</body>
</html>
`)}