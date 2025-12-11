import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.TITAN_SMTP_HOST || "smtp.titan.email",
  port: Number.parseInt(process.env.TITAN_SMTP_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.TITAN_EMAIL_ADDRESS,
    pass: process.env.TITAN_EMAIL_PASSWORD,
  },
})

interface EmailRequest {
  to: string
  type: "welcome" | "daily"
  name?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json()
    const { to, type, name } = body

    if (!process.env.TITAN_EMAIL_ADDRESS || !process.env.TITAN_EMAIL_PASSWORD) {
      console.error("[v0] Missing Titan email credentials in environment variables")
      return NextResponse.json(
        { error: "Email service not configured. Missing TITAN_EMAIL_ADDRESS or TITAN_EMAIL_PASSWORD" },
        { status: 500 },
      )
    }

    if (!to || !type) {
      return NextResponse.json({ error: "Missing required fields: to, type" }, { status: 400 })
    }

    let subject = ""
    let htmlContent = ""

    if (type === "welcome") {
      subject = "Welcome to NoxyAI!"
      htmlContent = `<!DOCTYPE html><html lang="en" style="margin:0;padding:0;">  <head>    <meta charset="UTF-8" />    <meta name="viewport" content="width=device-width, initial-scale=1.0" />    <title>Welcome to NoxyAI</title>    <style>      body {        margin: 0;        padding: 0;        background-color: #ffffff;        font-family: 'Segoe UI', Arial, sans-serif;        color: #000000;      }      .container {        max-width: 480px;        margin: 0 auto;        padding: 24px;        border: 1px solid #e0e0e0;        border-radius: 12px;      }      .logo {        text-align: center;        margin-bottom: 24px;      }      .logo img {        width: 160px;        height: auto;      }      h1 {        text-align: center;        font-size: 24px;        margin-bottom: 10px;      }      p {        font-size: 15px;        line-height: 1.6;        text-align: center;        color: #333;      }      .button {        display: inline-block;        background-color: #000000;        color: #ffffff;        padding: 12px 24px;        border-radius: 8px;        text-decoration: none;        font-weight: bold;        margin: 24px auto;        text-align: center;      }      .button:hover {        opacity: 0.9;      }      .footer {        text-align: center;        font-size: 13px;        color: #555;        margin-top: 32px;        border-top: 1px solid #ddd;        padding-top: 16px;      }      .footer a {        color: #000;        text-decoration: none;        margin: 0 6px;      }      @media screen and (max-width: 480px) {        .container {          padding: 16px;        }        h1 {          font-size: 22px;        }      }    </style>  </head>  <body>    <div class="container">      <div class="logo">        <img src="/images/design-mode/logo-black.png" alt="NoxyAI Logo" />      </div>      <h1>Welcome to NoxyAI!</h1>      <p>        We're thrilled to have you on board. NoxyAI helps you create, explore, and innovate with powerful AI tools designed for everyone.      </p>      <a href="https://community.noxyai.com" class="button">Join Our Community</a>      <p>        Connect with other creators, share ideas, and stay up-to-date with our latest updates.      </p>      <div class="footer">        <p>Need help? Contact <a href="mailto:support@noxyai.com">support@noxyai.com</a></p>        <p>          <a href="https://x.com/Noxyaiofficial?s=09">X (Twitter)</a> |          <a href="https://youtube.com/@noxyai?si=OFZp6OfTiSdmqnWO">YouTube</a>        </p>        <p>© 2025 NoxyAI. All rights reserved.</p>      </div>    </div>  </body></html>`
    } else if (type === "daily") {
      subject = "Your Daily Noxy AI Update"
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Your Daily Noxy AI Update</h1>
          </div>
          <div style="padding: 40px; background: #f9f9f9; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              Hi ${name || "there"},
            </p>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              We've got some exciting updates and features for you to explore today. Check out what's new in your Noxy AI dashboard!
            </p>
            <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
              <p style="color: #333; font-size: 14px; margin: 0;">
                💡 <strong>Tip:</strong> Try using our new avatar customization features to create your perfect AI companion.
              </p>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Keep exploring!<br/>
              <strong>The Noxy AI Team</strong>
            </p>
          </div>
        </div>
      `
    }

    const mailOptions = {
      from: process.env.TITAN_EMAIL_ADDRESS,
      to,
      subject,
      html: htmlContent,
    }

    console.log("[v0] Attempting to send email to:", to)
    console.log("[v0] Email type:", type)
    console.log("[v0] From address:", process.env.TITAN_EMAIL_ADDRESS)

    try {
      await transporter.verify()
      console.log("[v0] SMTP connection verified successfully")
    } catch (verifyError) {
      console.error("[v0] SMTP verification failed:", verifyError)
      return NextResponse.json({ error: "Email service connection failed. Check SMTP credentials." }, { status: 500 })
    }

    await transporter.sendMail(mailOptions)
    console.log("[v0] Email sent successfully to:", to)

    return NextResponse.json({ success: true, message: "Email sent successfully" })
  } catch (error) {
    console.error("[v0] Email sending error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to send email"
    console.error("[v0] Error details:", errorMessage)
    return NextResponse.json({ error: `Email service error: ${errorMessage}` }, { status: 500 })
  }
}
