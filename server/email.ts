import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || "TapTrao <noreply@taptrao.com>";

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  if (!resend) {
    console.log("[email] No RESEND_API_KEY set — password reset link:");
    console.log(`[email] ${resetUrl}`);
    return;
  }

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Reset your TapTrao password",
    html: `
      <div style="font-family: Inter, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <div style="margin-bottom: 24px;">
          <strong style="font-size: 18px; color: #1a1a1a;">TapTrao</strong>
        </div>
        <h1 style="font-size: 22px; font-weight: 600; color: #1a1a1a; margin: 0 0 12px;">Reset your password</h1>
        <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 24px;">
          We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #6b9080; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600;">
          Reset Password
        </a>
        <p style="font-size: 12px; color: #999; margin-top: 32px; line-height: 1.5;">
          If you didn't request this, you can safely ignore this email. Your password won't change.
        </p>
      </div>
    `,
  });
}
