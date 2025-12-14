# PayPal Integration Setup Guide

This document explains how to set up PayPal as a payment option for Noxyai subscriptions.

## Environment Variables

Add the following environment variables to your Vercel project:

\`\`\`bash
# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com  # Use https://api-m.paypal.com for production
PAYPAL_WEBHOOK_ID=your_webhook_id
\`\`\`

## Getting PayPal Credentials

### 1. Create PayPal Developer Account
- Go to https://developer.paypal.com
- Sign up or log in with your PayPal account
- Access the Dashboard

### 2. Create an App
- Navigate to "My Apps & Credentials"
- Click "Create App"
- Give it a name (e.g., "Noxyai Subscriptions")
- Select "Merchant" as the app type
- Click "Create App"

### 3. Get Client ID and Secret
- After creating the app, you'll see your **Client ID** and **Secret**
- Copy these to your environment variables:
  - `PAYPAL_CLIENT_ID` = Client ID
  - `PAYPAL_CLIENT_SECRET` = Secret

### 4. Configure Webhook

#### Set Up Webhook URL
Your webhook URL will be:
\`\`\`
https://www.noxyai.com/api/subscription/paypal/webhook
\`\`\`

#### Steps to Create Webhook:
1. In your PayPal app dashboard, scroll to "Webhooks"
2. Click "Add Webhook"
3. Enter webhook URL: `https://www.noxyai.com/api/subscription/paypal/webhook`
4. Select the following events:
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
   - `PAYMENT.SALE.COMPLETED`
   - `PAYMENT.SALE.DENIED`
5. Click "Save"
6. Copy the **Webhook ID** and add it to `PAYPAL_WEBHOOK_ID`

## Testing

### Sandbox Mode
- By default, `PAYPAL_BASE_URL` points to sandbox: `https://api-m.sandbox.paypal.com`
- Use sandbox credentials for testing
- Create test accounts at https://developer.paypal.com/dashboard/accounts

### Test Flow:
1. Select USD currency on pricing page
2. Click "Subscribe with PayPal"
3. You'll be redirected to PayPal sandbox
4. Log in with your test buyer account
5. Approve the subscription
6. You'll be redirected back to Noxyai

## Production Setup

When ready for production:

1. Switch to Live credentials:
   - Get Live Client ID and Secret from your PayPal app
   - Create a new webhook with the production URL
   
2. Update environment variables:
   \`\`\`bash
   PAYPAL_BASE_URL=https://api-m.paypal.com
   PAYPAL_CLIENT_ID=your_live_client_id
   PAYPAL_CLIENT_SECRET=your_live_client_secret
   PAYPAL_WEBHOOK_ID=your_live_webhook_id
   \`\`\`

3. Test thoroughly with small amounts before going fully live

## Features

### Pricing
- **Monthly Plan**: $15.99/month (≈ ₹1,299)
- **Yearly Plan**: $159.99/year (≈ ₹12,999, saves ~$32/year)

### Payment Flow
1. User selects USD currency and PayPal payment method
2. Subscription is created in PayPal with recurring billing
3. User approves subscription on PayPal
4. Webhook activates subscription in database
5. Recurring payments are processed automatically by PayPal

### Grace Period
- Same 3-day grace period as PayU
- If payment fails, user has 3 days to retry
- After 3 failed attempts, subscription expires

### Webhook Events
The webhook handles:
- Subscription activation
- Recurring payment success
- Payment failures
- Subscription cancellation

## Currency Conversion

- USD prices are displayed alongside INR
- Approximate conversion: 83 INR = 1 USD
- Prices are stored in INR in the database for consistency

## Support

For issues:
- Check webhook logs in PayPal dashboard
- Review server logs for webhook processing
- Contact PayPal Developer Support: https://developer.paypal.com/support/

## Security Notes

- Never commit credentials to Git
- Use environment variables for all sensitive data
- Webhook signature verification is implemented
- HTTPS is required for production webhooks
