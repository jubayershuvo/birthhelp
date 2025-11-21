// import nodemailer from "nodemailer";

import axios from "axios";
import { generateOtp } from "./otp";

// Interface for email options
interface EmailOptions {
  to: string;
  userName?: string;
  expiryMinutes?: number;
}

// Email template with Fiverr-inspired design
const getEmailTemplate = (
  otp: string,
  userName: string = "User",
  expiryMinutes: number = 10
): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Email Verification</title>
      <style>
        @media only screen and (max-width: 600px) {
          .container { width: 100% !important; }
          .content { padding: 30px 20px !important; }
          .header { padding: 30px 20px 15px !important; }
          .footer { padding: 25px 20px !important; }
          .otp-box { padding: 25px 15px !important; }
          .otp-code { font-size: 32px !important; letter-spacing: 6px !important; }
          .greeting { font-size: 15px !important; }
          .title { font-size: 24px !important; }
        }
        @media (prefers-color-scheme: dark) {
          .dark-mode-bg { background-color: #1a1a1a !important; }
          .dark-mode-card { background-color: #2d2d2d !important; }
          .dark-mode-text { color: #e0e0e0 !important; }
          .dark-mode-text-secondary { color: #b0b0b0 !important; }
        }
      </style>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
      
      <div style="width: 100%; height: 100%; padding: 20px 0;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center">
              <table role="presentation" class="container" style="width: 600px; max-width: 100%; border-collapse: collapse; margin: 0 auto;">
                
                <!-- Main Card -->
                <tr>
                  <td style="padding: 0 15px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
                      
                      <!-- Animated Header -->
                      <tr>
                        <td class="header" style="padding: 45px 40px 25px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); position: relative;">
                          <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 3px solid rgba(255,255,255,0.3);">
                            <div style="font-size: 40px;">🔐</div>
                          </div>
                          <h1 class="title" style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -1px; text-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            Verify Your Email
                          </h1>
                          <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 15px; font-weight: 500;">
                            One more step to get started
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Content -->
                      <tr>
                        <td class="content" style="padding: 45px 40px;">
                          <p class="greeting" style="margin: 0 0 10px; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                            Hey ${userName}! 👋
                          </p>
                          
                          <p style="margin: 0 0 30px; color: #4a5568; font-size: 16px; line-height: 1.7;">
                            Thanks for joining us! Enter this verification code to complete your registration and unlock your account.
                          </p>
                          
                          <!-- Modern OTP Box -->
                          <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 35px;">
                            <tr>
                              <td align="center" class="otp-box" style="padding: 35px 20px; background: linear-gradient(135deg, #f6f8fc 0%, #eef2f7 100%); border-radius: 12px; border: 2px solid #e2e8f0; position: relative;">
                                <div style="margin-bottom: 8px; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                                  Your Verification Code
                                </div>
                                <div class="otp-code" style="font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #667eea; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(102,126,234,0.1);">
                                  ${otp}
                                </div>
                                <div style="margin-top: 12px; display: inline-block; padding: 6px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; font-size: 11px; color: #ffffff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                                  Expires in ${expiryMinutes} min
                                </div>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Info Cards -->
                          <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 25px;">
                            <tr>
                              <td style="padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 10px; border-left: 4px solid #f59e0b;">
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                  <tr>
                                    <td style="width: 30px; vertical-align: top; font-size: 24px;">⚡</td>
                                    <td style="vertical-align: top;">
                                      <p style="margin: 0 0 5px; color: #92400e; font-size: 14px; font-weight: 700;">
                                        Quick Tip
                                      </p>
                                      <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.5;">
                                        Copy and paste this code into the verification field. Don't refresh the page!
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          
                          <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 25px;">
                            <tr>
                              <td style="padding: 20px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 10px; border-left: 4px solid #3b82f6;">
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                  <tr>
                                    <td style="width: 30px; vertical-align: top; font-size: 24px;">🔒</td>
                                    <td style="vertical-align: top;">
                                      <p style="margin: 0 0 5px; color: #1e40af; font-size: 14px; font-weight: 700;">
                                        Security First
                                      </p>
                                      <p style="margin: 0; color: #1e3a8a; font-size: 13px; line-height: 1.5;">
                                        Never share this code with anyone. We'll never ask for it via phone, email, or chat.
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6; text-align: center;">
                            Didn't request this code? You can safely ignore this email.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td class="footer" style="padding: 30px 40px; background: linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%); border-top: 1px solid #e2e8f0;">
                          <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <tr>
                              <td align="center">
                                <a href="mailto:support@yourapp.com" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; box-shadow: 0 4px 12px rgba(102,126,234,0.3); transition: transform 0.2s;">
                                  Get Help
                                </a>
                              </td>
                            </tr>
                          </table>
                          
                          <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                            <tr>
                              <td align="center">
                                <a href="#" style="display: inline-block; margin: 0 10px; color: #64748b; text-decoration: none; font-size: 12px;">Privacy</a>
                                <span style="color: #cbd5e1;">•</span>
                                <a href="#" style="display: inline-block; margin: 0 10px; color: #64748b; text-decoration: none; font-size: 12px;">Terms</a>
                                <span style="color: #cbd5e1;">•</span>
                                <a href="#" style="display: inline-block; margin: 0 10px; color: #64748b; text-decoration: none; font-size: 12px;">Unsubscribe</a>
                              </td>
                            </tr>
                          </table>
                          
                          <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.5;">
                            © ${new Date().getFullYear()} Your Company, Inc. All rights reserved.<br>
                            123 Business Street, Suite 100, City, State 12345
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
                
                <!-- Bottom Spacing -->
                <tr>
                  <td style="height: 20px;"></td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </div>
      
    </body>
    </html>
  `;
};

// Configure email transporter
// const createTransporter = () => {
//   return nodemailer.createTransporter({
//     service: 'gmail',
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASSWORD
//     }
//   });
// };

// Send OTP email - OTP must be provided by caller
export const sendOTPEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const { to, userName = "User", expiryMinutes = 10 } = options;
    const otp = generateOtp(to);
console.log(otp)
    // const transporter = createTransporter();

    // const mailOptions = {
    //   from: `"Your App Name" <${process.env.EMAIL_USER}>`,
    //   to,
    //   subject: 'Verify Your Email Address',
    //   html: getEmailTemplate(otp, userName, expiryMinutes)
    // };

    // const info = await transporter.sendMail(mailOptions);
    // console.log('Email sent successfully:', info.messageId);

    await axios.post(
      "https://mailer-js.vercel.app/api/send-mail-external",
      {
        apiKey:"abffac8695afbca7620af53d7c413da31b82059a5884dd3acd43f05a1a4fd546",
        to,
        subject: "Otp Verification",
        text: getEmailTemplate(otp, userName, expiryMinutes),
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

export default sendOTPEmail;
