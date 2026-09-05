/**
 * EmailService — production transactional email wrapper
 *
 * Supported providers: sendgrid
 *
 * Required environment variables:
 *   EMAIL_PROVIDER          = "sendgrid"
 *   SENDGRID_API_KEY        = <secret — set in Render env vars only>
 *   PASSWORD_RESET_FROM_EMAIL = <verified sender address>
 */

export class EmailService {
  private provider: string;
  private fromEmail: string;

  constructor() {
    this.provider = (process.env['EMAIL_PROVIDER'] || 'sendgrid').toLowerCase().trim();
    this.fromEmail = (process.env['PASSWORD_RESET_FROM_EMAIL'] || '1ep23cs071.jesse@gmail.com').trim();

    if (!this.provider) {
      throw new Error('EMAIL_PROVIDER environment variable is required (default: "sendgrid").');
    }
    if (!this.fromEmail) {
      throw new Error('PASSWORD_RESET_FROM_EMAIL environment variable is required.');
    }

    if (this.provider === 'sendgrid') {
      const apiKey = process.env['SENDGRID_API_KEY'];
      if (!apiKey) {
        throw new Error('SENDGRID_API_KEY environment variable is required for SendGrid provider.');
      }
    } else {
      throw new Error(`Unsupported EMAIL_PROVIDER: "${this.provider}". Supported values: "sendgrid".`);
    }
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    if (!to || !resetUrl) {
      throw new Error('EmailService.sendPasswordReset: missing "to" address or "resetUrl".');
    }

    const subject = 'CLOUDPULSE — Password Reset Request';
    const textBody = [
      'You (or someone else) requested a password reset for your CLOUDPULSE account.',
      '',
      'Click the link below to reset your password. This link expires in 1 hour and can only be used once:',
      '',
      resetUrl,
      '',
      'If you did not request this, you can safely ignore this email. Your password will not change.',
      '',
      '— The CLOUDPULSE Team',
    ].join('\n');

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Password Reset</title></head>
<body style="font-family:sans-serif;background:#0a0d12;color:#e2e8f0;padding:32px;">
  <div style="max-width:520px;margin:0 auto;background:#111827;border:1px solid #1e293b;border-radius:10px;padding:28px;">
    <div style="font-size:20px;font-weight:800;letter-spacing:0.05em;color:#38bdf8;margin-bottom:12px;">CLOUDPULSE</div>
    <h2 style="font-size:16px;font-weight:700;color:#f1f5f9;margin:0 0 16px 0;">Password Reset Request</h2>
    <p style="font-size:14px;line-height:1.6;color:#94a3b8;margin:0 0 20px 0;">
      You (or someone else) requested a password reset for your CLOUDPULSE account.
      Click the button below to reset your password.
    </p>
    <a href="${resetUrl}"
       style="display:inline-block;padding:11px 24px;background:#3b82f6;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;">
      Reset My Password
    </a>
    <p style="font-size:12px;color:#64748b;margin-top:20px;line-height:1.5;">
      This link expires in <strong>1 hour</strong> and can only be used once.<br>
      If you did not request this, you can safely ignore this email. Your password will not change.
    </p>
    <hr style="border:none;border-top:1px solid #1e293b;margin:20px 0;">
    <p style="font-size:11px;color:#475569;margin:0;">— The CLOUDPULSE Team</p>
  </div>
</body>
</html>`.trim();

    await this.sendViaSendGrid(to, subject, textBody, htmlBody);
  }

  private async sendViaSendGrid(to: string, subject: string, text: string, html: string): Promise<void> {
    const apiKey = process.env['SENDGRID_API_KEY']!;

    const payload = {
      personalizations: [{ to: [{ email: to }] }],
      from: { email: this.fromEmail },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html },
      ],
    };

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '(could not read body)');
      throw new Error(`SendGrid API error [${response.status}]: ${errBody}`);
    }
    // SendGrid 202 Accepted = success (no body)
  }
}
