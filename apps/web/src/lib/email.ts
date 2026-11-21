import nodemailer from 'nodemailer';

/**
 * Enterprise Mail Transporter configuration
 * Uses Gmail SMTP with STARTTLS (Port 587) or SSL (Port 465)
 */
export function getMailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '').trim();

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Generic email dispatcher with robust error handling
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = getMailTransporter();
    const fromAddress = options.from || process.env.SMTP_FROM || `"HomeSeva ERP" <${process.env.SMTP_USER || 'no-reply@homeseva.internal'}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    });

    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error('SMTP sendEmail error:', err);
    return { success: false, error: err?.message || 'Failed to dispatch email' };
  }
}

export interface MemberCredentialsEmailParams {
  to: string;
  memberName: string;
  companyName: string;
  subcompany?: string;
  role: string;
  email: string;
  password: string;
  pin: string;
  businessSlug: string;
  loginUrl?: string;
}

/**
 * Dispatches an ultra-clean, colorful, modern card email to newly allotted staff members
 * Contains Company, Subcompany, Role, Login Email, Password, and Security PIN.
 */
export async function sendMemberWelcomeCredentialsEmail(params: MemberCredentialsEmailParams) {
  const {
    to,
    memberName,
    companyName,
    subcompany,
    role,
    email,
    password,
    pin,
    businessSlug,
  } = params;

  const appBase = process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, '')
    : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

  // Base domain link only (clean root domain, no deep / direct slug link)
  const loginUrl = params.loginUrl || appBase;
  const displayUrl = loginUrl.replace(/^https?:\/\//, '');

  const targetSubcompany = subcompany || companyName;
  const subject = `welcome to homeseva erp ${targetSubcompany}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      max-width: 620px;
      margin: 25px auto;
      background-color: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.8);
    }
    .header-banner {
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #4f46e5 100%);
      padding: 36px 32px 32px;
      text-align: left;
      color: #ffffff;
    }
    .brand-pill {
      display: inline-block;
      background: rgba(255, 255, 255, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 5px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #ffffff;
      margin-bottom: 14px;
    }
    .banner-title {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.02em;
      line-height: 1.25;
      color: #ffffff;
    }
    .banner-subtitle {
      margin: 6px 0 0;
      font-size: 13.5px;
      color: #bfdbfe;
      line-height: 1.4;
    }
    .content-body {
      padding: 32px;
    }
    .greeting {
      font-size: 15px;
      font-weight: 600;
      color: #334155;
      margin-bottom: 18px;
      line-height: 1.5;
    }
    /* Colorful Full Card */
    .cred-card {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 18px;
      padding: 22px 24px;
      margin: 20px 0;
    }
    .card-header-badge {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    .company-title {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
    }
    .subcompany-badge {
      display: inline-block;
      background: #e0e7ff;
      color: #3730a3;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 700;
      margin-left: 8px;
    }
    .cred-grid {
      width: 100%;
      border-collapse: collapse;
    }
    .cred-grid td {
      padding: 9px 0;
      vertical-align: middle;
    }
    .cred-label {
      font-size: 11.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      width: 38%;
    }
    .cred-value {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .badge-role {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 800;
    }
    .code-box {
      display: inline-block;
      background: #0f172a;
      color: #f8fafc;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 14px;
      font-weight: 700;
      padding: 5px 12px;
      border-radius: 8px;
      letter-spacing: 0.04em;
    }
    .pin-box {
      display: inline-block;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 15px;
      font-weight: 800;
      padding: 4px 14px;
      border-radius: 8px;
      letter-spacing: 0.18em;
    }
    .cta-container {
      text-align: center;
      margin: 28px 0 16px;
    }
    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 800;
      padding: 13px 32px;
      border-radius: 12px;
      box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4);
      letter-spacing: 0.01em;
      text-align: center;
    }
    .steps-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .steps-title {
      font-size: 12px;
      font-weight: 800;
      color: #1e293b;
      margin: 0 0 8px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .steps-list {
      margin: 0;
      padding-left: 18px;
      font-size: 12.5px;
      color: #475569;
      line-height: 1.6;
    }
    .footer {
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 22px 32px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      line-height: 1.6;
    }
    .signature {
      font-size: 11px;
      color: #64748b;
      font-style: italic;
      margin-top: 12px;
      text-align: center;
      letter-spacing: 0.02em;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header-banner">
      <div class="brand-pill">HOMESEVA ENTERPRISE ERP</div>
      <h1 class="banner-title">Welcome to ${companyName}</h1>
      <p class="banner-subtitle">Official credentials created by Super Administrator for your workspace portal.</p>
    </div>

    <!-- Content -->
    <div class="content-body">
      <div class="greeting">
        Hello <strong>${memberName}</strong>,<br>
        Your staff credentials have been officially configured on HomeSeva Central ERP. Here are your access details:
      </div>

      <!-- Full Colorful Credential Card -->
      <div class="cred-card">
        <div class="card-header-badge">
          <span class="company-title">${companyName}</span>
          ${subcompany ? `<span class="subcompany-badge">${subcompany}</span>` : ''}
        </div>

        <table class="cred-grid">
          <tr>
            <td class="cred-label">Company</td>
            <td class="cred-value"><strong>${companyName}</strong></td>
          </tr>
          ${subcompany ? `
          <tr>
            <td class="cred-label">Subcompany</td>
            <td class="cred-value"><strong>${subcompany}</strong></td>
          </tr>` : ''}
          <tr>
            <td class="cred-label">Role</td>
            <td class="cred-value"><span class="badge-role">${role}</span></td>
          </tr>
          <tr>
            <td class="cred-label">Email</td>
            <td class="cred-value"><span style="font-family: monospace; color: #1e40af; font-size: 13.5px;">${email}</span></td>
          </tr>
          <tr>
            <td class="cred-label">Pass</td>
            <td class="cred-value"><span class="code-box">${password}</span></td>
          </tr>
          <tr>
            <td class="cred-label">PIN</td>
            <td class="cred-value"><span class="pin-box">${pin}</span></td>
          </tr>
        </table>
      </div>

      <!-- Action Button -->
      <div class="cta-container">
        <a href="${loginUrl}" class="cta-btn" target="_blank" rel="noopener noreferrer">
          Launch Workspace Portal &rarr;
        </a>
      </div>

      <!-- Quick Instructions -->
      <div class="steps-card">
        <div class="steps-title">🔑 How to Sign In:</div>
        <ol class="steps-list">
          <li>Open browser and go to: <a href="${loginUrl}" style="color: #2563eb; font-weight: 700; text-decoration: underline;">${displayUrl}</a></li>
          <li>Select your company: <strong>${companyName}</strong></li>
          <li>Select your role: <strong>${role}</strong></li>
          <li>Enter your email: <strong>${email}</strong></li>
          <li>Enter your password and PIN to access your workspace</li>
        </ol>
      </div>

      <p style="font-size: 11.5px; color: #64748b; line-height: 1.5; margin: 18px 0 0; text-align: center;">
        Portal Link: <a href="${loginUrl}" style="color: #2563eb; word-break: break-all; font-weight: 600;">${displayUrl}</a>
      </p>
    </div>

    <!-- Footer with corporate signature -->
    <div class="footer">
      <div><strong>Confidential Enterprise Document</strong></div>
      <div>This message was automatically dispatched by HomeSeva Central ERP on behalf of Super Administration.</div>
      <div class="signature">HomeSeva Enterprise Administration</div>
    </div>
  </div>
</body>
</html>
  `.trim();

  return await sendEmail({
    to,
    subject,
    html,
  });
}
