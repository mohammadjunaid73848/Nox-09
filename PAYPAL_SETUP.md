# PayPal Integration Setup Guide

This document explains how to set up PayPal as a payment option for Noxyai subscriptions.

## Quick Start (3 Steps)

### Step 1: Run the Setup Script
Execute the PayPal setup script in v0 to create your Product and Billing Plans:

\`\`\`bash
# The script will create:
# - 1 Product (SuperNoxy Pro Subscription)
# - 2 Billing Plans (Monthly $15.99, Yearly $159.99)
\`\`\`

The script will output Plan IDs that you need to add as environment variables.

### Step 2: Add Environment Variables
Add the following environment variables in v0 **Vars section** (click Settings icon → Vars):

\`\`\`bash
# Required - Get from PayPal Developer Dashboard
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Required - From setup script output
PAYPAL_PRODUCT_ID=PROD-XXXXXXXXXXXX
PAYPAL_MONTHLY_PLAN_ID=P-XXXXXXXXXXXX
PAYPAL_YEARLY_PLAN_ID=P-XXXXXXXXXXXX

# Base URL (use sandbox for testing, live for production)
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com

# Optional - For webhook verification
PAYPAL_WEBHOOK_ID=your_webhook_id
\`\`\`

### Step 3: Test the Integration
Visit your pricing page and check the debug panel - all indicators should be green ✓

---

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

### 4. Run Setup Script
Once you have Client ID and Secret configured:
1. Execute the `scripts/setup-paypal-plans.ts` script in v0
2. The script will:
   - Authenticate with PayPal
   - Create a Product called "SuperNoxy Pro Subscription"
   - Create Monthly Plan ($15.99/month)
   - Create Yearly Plan ($159.99/year)
   - Output the Plan IDs
3. Copy the Plan IDs and add them to your environment variables

### 5. Configure Webhook

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

## Troubleshooting

### Error: "PayPal configuration incomplete"

**Cause**: Missing `PAYPAL_CLIENT_ID` or `PAYPAL_CLIENT_SECRET` in environment variables

**Solution**:
1. Open v0 in-chat sidebar (Settings icon on left)
2. Go to **Vars** section
3. Add the environment variables exactly as shown:
   - `PAYPAL_CLIENT_ID` = your client ID (no quotes, no spaces)
   - `PAYPAL_CLIENT_SECRET` = your client secret (no quotes, no spaces)
4. After adding, the debug panel on the pricing page should show green checkmarks

**Important**: 
- Do NOT add quotes around values
- Do NOT add extra spaces before or after
- Restart dev server after adding variables

### Error: "PayPal plan not configured"

**Cause**: Missing `PAYPAL_MONTHLY_PLAN_ID` or `PAYPAL_YEARLY_PLAN_ID`

**Solution**:
1. Run the setup script: `scripts/setup-paypal-plans.ts`
2. Copy the Plan IDs from the script output
3. Add them to environment variables in the **Vars** section:
   - `PAYPAL_PRODUCT_ID`
   - `PAYPAL_MONTHLY_PLAN_ID`
   - `PAYPAL_YEARLY_PLAN_ID`

### Debug Panel Shows Missing Configuration

The pricing page has a built-in debug panel that shows:
- ✓ Green checkmark = configured correctly
- ✗ Red X = missing configuration
- ⚠️ Yellow warning = optional but recommended

Check the "Raw Environment Detection" section to see if variables are being loaded.

### Common Issues

1. **Invalid Credentials**: Make sure you're using credentials from the correct environment (Sandbox vs Live)
2. **Variables Not Loading**: 
   - Check you added them in the v0 **Vars section** (not just local .env)
   - Restart development server
   - For production, redeploy after adding variables
3. **Webhook Not Working**: Verify webhook URL is publicly accessible (https://www.noxyai.com)
4. **CORS Errors**: PayPal redirects should work with proper return URLs set

### Testing Checklist

- [ ] PayPal Developer account created
- [ ] App created in PayPal dashboard
- [ ] `PAYPAL_CLIENT_ID` added to v0 Vars section
- [ ] `PAYPAL_CLIENT_SECRET` added to v0 Vars section
- [ ] `PAYPAL_BASE_URL` set to sandbox URL
- [ ] Setup script executed successfully
- [ ] Plan IDs added to environment variables
- [ ] Debug panel shows all green checkmarks
- [ ] Webhook URL configured in PayPal dashboard

## Testing

### Sandbox Mode
- By default, `PAYPAL_BASE_URL` points to sandbox: `https://api-m.sandbox.paypal.com`
- Use sandbox credentials for testing
- Create test accounts at https://developer.paypal.com/dashboard/accounts

### Test Flow:
1. Check debug panel - all should be green ✓
2. Select USD currency on pricing page
3. Click "Subscribe with PayPal"
4. You'll be redirected to PayPal sandbox
5. Log in with your test buyer account
6. Approve the subscription
7. You'll be redirected back to Noxyai

### Test Accounts
PayPal provides test accounts for sandbox:
- **Buyer Account**: Use to make test purchases
- **Seller Account**: Your business account (receives payments)

## Production Setup

When ready for production:

1. Switch to Live credentials:
   - Get Live Client ID and Secret from your PayPal app
   - Run the setup script again with Live credentials to create Live plans
   - Create a new webhook with the production URL
   
2. Update environment variables:
   \`\`\`bash
   PAYPAL_BASE_URL=https://api-m.paypal.com
   PAYPAL_CLIENT_ID=your_live_client_id
   PAYPAL_CLIENT_SECRET=your_live_client_secret
   PAYPAL_PRODUCT_ID=PROD-LIVE-XXXXXXXX
   PAYPAL_MONTHLY_PLAN_ID=P-LIVE-MONTHLY-XXXXX
   PAYPAL_YEARLY_PLAN_ID=P-LIVE-YEARLY-XXXXX
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

## Architecture

### Why Use Pre-Created Plans?

The integration uses pre-created Plan IDs instead of creating plans dynamically for each transaction because:

1. **Prevents Spam**: Creating a new plan for every user would result in hundreds of duplicate plans
2. **Better Performance**: Reusing plans is faster and more efficient
3. **PayPal Best Practice**: PayPal recommends creating plans once and reusing them
4. **Easier Management**: View all subscriptions under a single plan in PayPal dashboard

### How It Works

1. **Setup Phase** (one-time):
   - Run setup script
   - Creates 1 Product and 2 Plans in PayPal
   - Store Plan IDs in environment variables

2. **Runtime Phase** (for each subscription):
   - Use stored Plan IDs to create subscriptions
   - No dynamic plan creation needed
   - Fast and reliable

## Currency Conversion

- USD prices are displayed alongside INR
- Approximate conversion: 83 INR = 1 USD
- Prices are stored in INR in the database for consistency

## Support

For issues:
- Check the debug panel on pricing page first
- Review server logs for detailed error messages
- Check webhook logs in PayPal dashboard
- Contact PayPal Developer Support: https://developer.paypal.com/support/

## Security Notes

- Never commit credentials to Git
- Use environment variables for all sensitive data
- Webhook signature verification is implemented
- HTTPS is required for production webhooks
- Plan IDs are not secret, but credentials are

## What's Different from the Errors You Found?

### Fixed Issues:
1. ✅ **No more infinite plan creation** - Plans are created once via setup script
2. ✅ **Proper error checking** - All API responses validated before proceeding
3. ✅ **Correct import syntax** - Fixed `Import` → `import`
4. ✅ **Plan IDs in config** - Stored in environment variables and reused
5. ✅ **Better configuration checks** - Direct property validation instead of `isConfigured` only

### Files Updated:
- `lib/paypal.ts` - Uses Plan IDs from env, no dynamic creation
- `lib/config/env.ts` - Added Plan ID variables
- `scripts/setup-paypal-plans.ts` - One-time script to generate Plan IDs

---

**Ready to use?** Execute the setup script to generate your Plan IDs, then add all variables to the v0 Vars section!
