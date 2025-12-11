# Supabase Email Templates

To update your Supabase email templates with modern designs including the Noxy AI logo, follow these steps:

## 1. Access Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**

## 2. Email Verification Template

Replace the default confirmation email template with:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Noxy AI</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Logo Section -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="https://noxyai.tommyai.tech/logo-black.png" alt="Noxy AI" width="80" height="80" style="display: block;">
            </td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 0 40px 20px 40px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #1a1a1a;">Verify Your Email</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 30px 40px; color: #666666; font-size: 16px; line-height: 1.6;">
              <p style="margin: 0 0 20px 0;">Welcome to Noxy AI! We're excited to have you on board.</p>
              <p style="margin: 0 0 20px 0;">Please confirm your email address by clicking the button below:</p>
            </td>
          </tr>
          
          <!-- Button -->
          <tr>
            <td align="center" style="padding: 0 40px 40px 40px;">
              <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 40px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Verify Email Address</a>
            </td>
          </tr>
          
          <!-- Alternative Link -->
          <tr>
            <td style="padding: 0 40px 30px 40px; color: #999999; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee;">
              <p style="margin: 20px 0 0 0;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin: 10px 0 0 0; word-break: break-all;"><a href="{{ .ConfirmationURL }}" style="color: #666666;">{{ .ConfirmationURL }}</a></p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 20px 40px 40px 40px; color: #999999; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 10px 0;">Powered by NoxyAI Team</p>
              <p style="margin: 0;">Visit <a href="https://www.tommyai.tech" style="color: #666666;">Tommy AI</a> to generate books by prompt</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
\`\`\`

## 3. Password Reset Template

Replace the default password reset email template with:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - Noxy AI</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Logo Section -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="https://noxyai.tommyai.tech/logo-black.png" alt="Noxy AI" width="80" height="80" style="display: block;">
            </td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 0 40px 20px 40px;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #1a1a1a;">Reset Your Password</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 30px 40px; color: #666666; font-size: 16px; line-height: 1.6;">
              <p style="margin: 0 0 20px 0;">We received a request to reset your password for your Noxy AI account.</p>
              <p style="margin: 0 0 20px 0;">Click the button below to create a new password:</p>
            </td>
          </tr>
          
          <!-- Button -->
          <tr>
            <td align="center" style="padding: 0 40px 40px 40px;">
              <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 40px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
            </td>
          </tr>
          
          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 40px 20px 40px; color: #999999; font-size: 14px; line-height: 1.6; background-color: #f9f9f9; border-radius: 8px; margin: 0 40px;">
              <p style="margin: 15px 0;"><strong style="color: #666666;">Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            </td>
          </tr>
          
          <!-- Alternative Link -->
          <tr>
            <td style="padding: 20px 40px 30px 40px; color: #999999; font-size: 14px; line-height: 1.6; border-top: 1px solid #eeeeee;">
              <p style="margin: 20px 0 0 0;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin: 10px 0 0 0; word-break: break-all;"><a href="{{ .ConfirmationURL }}" style="color: #666666;">{{ .ConfirmationURL }}</a></p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 20px 40px 40px 40px; color: #999999; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 10px 0;">Powered by NoxyAI Team</p>
              <p style="margin: 0;">Visit <a href="https://www.tommyai.tech" style="color: #666666;">Tommy AI</a> to generate books by prompt</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
\`\`\`

## 4. Update Email Settings

In your Supabase dashboard:

1. Go to **Authentication** → **Email Templates**
2. Select **Confirm signup** template and paste the Email Verification HTML
3. Select **Reset password** template and paste the Password Reset HTML
4. Click **Save** for each template

## Notes

- Make sure your logo is publicly accessible at `https://noxyai.tommyai.tech/logo-black.png`
- The templates use `{{ .ConfirmationURL }}` which is automatically replaced by Supabase
- Test the emails by signing up with a test account
- The templates are responsive and work on all email clients
