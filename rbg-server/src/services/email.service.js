const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendPasswordResetEmail(email, resetToken) {
    try {
      const resetURL = `${
        process.env.FRONTEND_URL || "https://rbg-form-client-sigma.vercel.app"
      }/reset-password/${resetToken}`;

      const mailOptions = {
        from: `"RBG HR Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Password Reset Request - RBG HR System",
        html: this.getPasswordResetEmailTemplate(resetURL),
        text: `You requested a password reset for your RBG HR account.

Please click the following link to reset your password:
${resetURL}

This link will expire in 7 days.

If you didn't request this password reset, please ignore this email.

Best regards,
RBG HR Team
Domain: rbghr.com`,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("Password reset email sent successfully:", result.messageId);
      return result;
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
  }

  getPasswordResetEmailTemplate(resetURL) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset - RBG HR System</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #ffffff;
            padding: 30px;
            border: 1px solid #ddd;
            border-radius: 0 0 5px 5px;
          }
          .button {
            display: inline-block;
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
          }
          .domain {
            font-weight: bold;
            color: #007bff;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>RBG HR System</h1>
          <p>Password Reset Request</p>
        </div>

        <div class="content">
          <h2>Hello!</h2>
          <p>You have requested to reset your password for your RBG HR account.</p>

          <p>Please click the button below to reset your password:</p>

          <a href="${resetURL}" class="button">Reset Password</a>

          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${resetURL}">${resetURL}</a></p>

          <p><strong>Important:</strong> This link will expire in 7 days for security reasons.</p>

          <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>

          <p>Domain: <span class="domain">rbghr.com</span></p>
        </div>

        <div class="footer">
          <p>This email was sent from RBG HR System.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>&copy; 2024 RBG HR. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
