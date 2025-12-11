import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: Request) {
  console.log("[v0] Send OTP API called")

  try {
    const supabase = await createClient()
    console.log("[v0] Supabase client created")

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] User:", user ? { id: user.id, email: user.email } : "No user")
    console.log("[v0] Auth error:", authError)

    if (authError || !user) {
      console.error("[v0] Unauthorized - no user or auth error")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateCheckRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/check-rate-limit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        actionType: "send_otp_2fa",
      }),
    })

    if (!rateCheckRes.ok) {
      const rateLimitData = await rateCheckRes.json()
      console.log("[v0] Rate limit exceeded for OTP:", rateLimitData)
      return NextResponse.json(
        { error: rateLimitData.reason || "Too many OTP requests. Try again later." },
        { status: 429 },
      )
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    console.log("[v0] Generated OTP:", otp)

    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    console.log("[v0] OTP expires at:", expiresAt)

    // Store OTP in database
    console.log("[v0] Storing OTP in database...")
    const { error: insertError } = await supabase.from("otp_codes").insert({
      user_id: user.id,
      code: otp,
      expires_at: expiresAt,
      used: false,
    })

    if (insertError) {
      console.error("[v0] Error storing OTP:", insertError)
      return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 })
    }
    console.log("[v0] OTP stored successfully")

    const smtpHost = process.env.TITAN_SMTP_HOST || "smtp.titan.email"
    const smtpPort = 587 // Use port 587 with STARTTLS
    const emailAddress = process.env.TITAN_EMAIL_ADDRESS
    const emailPassword = process.env.TITAN_EMAIL_PASSWORD

    console.log("[v0] Creating email transporter...")
    console.log("[v0] SMTP Host:", smtpHost)
    console.log("[v0] SMTP Port:", smtpPort)
    console.log("[v0] Email Address:", emailAddress)
    console.log("[v0] Password set:", !!emailPassword)

    if (!emailAddress || !emailPassword) {
      console.error("[v0] Missing email credentials")
      return NextResponse.json({ error: "Email service not configured. Please contact support." }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false, // Use STARTTLS
      auth: {
        user: emailAddress,
        pass: emailPassword,
      },
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
      },
    })

    console.log("[v0] Verifying SMTP connection...")
    try {
      await transporter.verify()
      console.log("[v0] SMTP connection verified successfully")
    } catch (verifyError: any) {
      console.error("[v0] SMTP verification failed:", verifyError)
      console.error("[v0] Error code:", verifyError.code)
      console.error("[v0] Error message:", verifyError.message)
      console.error("[v0] Error response:", verifyError.response)

      return NextResponse.json(
        {
          error: `Email service connection failed: ${verifyError.message || "Unknown error"}. Please ensure third-party email access is enabled in your Titan account settings.`,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Sending email to:", user.email)
    const mailOptions = {
      from: `"Noxy AI" <${emailAddress}>`,
      to: user.email,
      subject: "Your NoxyAI 2FA Verification Code",
      html: `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NoxyAI 2FA Verification</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #ffffff;
        font-family: 'Segoe UI', Arial, sans-serif;
        color: #000000;
      }
      .container {
        max-width: 480px;
        margin: 0 auto;
        padding: 24px;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
      }
      .logo {
        text-align: center;
        margin-bottom: 24px;
      }
      .logo img {
        width: 160px;
        height: auto;
      }
      h2 {
        text-align: center;
        font-size: 22px;
        margin-bottom: 8px;
      }
      p {
        font-size: 15px;
        line-height: 1.5;
        text-align: center;
        color: #333;
      }
      .otp-box {
        background-color: #000000;
        color: #ffffff;
        font-size: 28px;
        font-weight: bold;
        letter-spacing: 4px;
        text-align: center;
        padding: 16px 0;
        border-radius: 10px;
        margin: 24px auto;
        width: 70%;
      }
      .footer {
        text-align: center;
        font-size: 13px;
        color: #555;
        margin-top: 32px;
        border-top: 1px solid #ddd;
        padding-top: 16px;
      }
      .footer a {
        color: #000;
        text-decoration: none;
        margin: 0 6px;
      }
      @media screen and (max-width: 480px) {
        .container {
          padding: 16px;
        }
        .otp-box {
          width: 90%;
          font-size: 24px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">
        <img src="/images/design-mode/logo-black.png" alt="NoxyAI Logo" />
      </div>
      <h2>Two-Factor Authentication</h2>
      <p>Use the following one-time password (OTP) to verify your login to NoxyAI:</p>
      <div class="otp-box">${otp}</div>
      <p>This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
      <div class="footer">
        <p>Need help? Contact <a href="mailto:support@noxyai.com">support@noxyai.com</a></p>
        <p>
          <a href="https://x.com/Noxyaiofficial?s=09">X (Twitter)</a> |
          <a href="https://youtube.com/@noxyai?si=OFZp6OfTiSdmqnWO">YouTube</a>
        </p>
        <p>© 2025 NoxyAI. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`,
    }

    try {
      await transporter.sendMail(mailOptions)
      console.log("[v0] Email sent successfully")

      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/increment-rate-limit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          actionType: "send_otp_2fa",
        }),
      })
    } catch (sendError: any) {
      console.error("[v0] Error sending email:", sendError)
      console.error("[v0] Send error code:", sendError.code)
      console.error("[v0] Send error message:", sendError.message)
      console.error("[v0] Send error response:", sendError.response)

      return NextResponse.json(
        {
          error: `Failed to send email: ${sendError.message || "Unknown error"}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully to your email",
    })
  } catch (error) {
    console.error("[v0] Error in send-otp API:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[v0] Error details:", errorMessage)
    return NextResponse.json({ error: `Failed to send OTP: ${errorMessage}` }, { status: 500 })
  }
}
