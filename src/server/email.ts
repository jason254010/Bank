import { Resend } from 'resend';

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendPasswordResetEmail(
  toEmail: string,
  resetLink: string,
  recipientName: string = 'Administrator'
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || !apiKey.trim()) {
    const errorMsg = 'RESEND_API_KEY is missing or not configured in environment variables. Password reset email cannot be dispatched.';
    console.error(`[EMAIL ERROR] ${errorMsg}`);
    return {
      success: false,
      error: errorMsg
    };
  }

  const resend = new Resend(apiKey.trim());
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Nova Trust Bank <onboarding@resend.dev>';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f9; margin: 0; padding: 0; color: #1e293b; }
          .container { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
          .header { background: #0057B8; padding: 32px 24px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
          .content { padding: 32px 28px; }
          .content p { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 20px; }
          .btn-container { text-align: center; margin: 32px 0; }
          .btn { background: #0057B8; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block; font-size: 15px; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; }
          .link-box { background: #f1f5f9; padding: 12px; border-radius: 6px; font-size: 12px; word-break: break-all; color: #475569; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NOVA TRUST BANK</h1>
          </div>
          <div class="content">
            <p>Hello ${recipientName},</p>
            <p>A password reset request was initiated for your Nova Trust Bank account (<strong>${toEmail}</strong>).</p>
            <p>Click the button below to complete your password reset. This single-use link is valid for <strong>15 minutes</strong>.</p>
            <div class="btn-container">
              <a href="${resetLink}" class="btn" target="_blank">Reset Password</a>
            </div>
            <p style="font-size: 13px; color: #64748b;">If the button above does not work, copy and paste this link into your web browser:</p>
            <div class="link-box">${resetLink}</div>
            <p style="margin-top: 24px; font-size: 13px; color: #64748b;">If you did not initiate this request, please ignore this message or contact bank security immediately.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Nova Trust Bank. All rights reserved. Confidential Security Dispatch.
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const response = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      subject: 'Nova Trust Bank - Password Reset Link',
      html,
    });

    if (response.error) {
      const errDetail = response.error.message || JSON.stringify(response.error);
      console.error(`[RESEND API ERROR] ${errDetail}`);
      return { success: false, error: `Resend Email Delivery Error: ${errDetail}` };
    }

    return { success: true, id: response.data?.id };
  } catch (err: any) {
    const errDetail = err?.message || 'Unknown network error when connecting to Resend';
    console.error(`[RESEND EXCEPTION] ${errDetail}`);
    return { success: false, error: `Failed to dispatch email via Resend API: ${errDetail}` };
  }
}
