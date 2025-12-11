# Environment Variables Configuration

## Overview
This directory contains centralized environment variable management for the Noxyai application.

## Files
- **env.ts**: Centralized configuration that exports all environment variables
- **.env.example**: Template file showing all required environment variables

## Usage

### For Development
1. Copy `.env.example` to `.env.local`:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. Fill in your actual values in `.env.local`

### For Deployment
When deploying to a hosting platform (Vercel, Netlify, Railway, etc.):

1. Go to your platform's environment variables settings
2. Add all variables from `.env.example`
3. The values will automatically be available to your application

### Adding New Environment Variables

1. Add the variable to `.env.example` with a descriptive name
2. Add the variable retrieval logic to `lib/config/env.ts` under the appropriate section
3. Update this README with the new variable's purpose

## Environment Variables by Category

### Supabase (Required)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)
- Other Postgres connection strings for specific use cases

### Google Search (Optional)
- `GOOGLE_CSE_API_KEY` - Google Custom Search API key
- `GOOGLE_CSE_CX` - Google Search Engine ID

### AI APIs (Required)
- `TOGETHER_API_KEY` - Together AI API key
- `CEREBRAS_API_KEY` - Cerebras API key
- `HUGGINGFACE_API_KEY` - Hugging Face API key
- `NOXYAI_API_KEY` - Noxyai API key
- `GROQ_API_KEY` - Groq API key

### Email Service (Required for email features)
- `TITAN_SMTP_HOST` - SMTP host (default: smtp.titan.email)
- `TITAN_SMTP_PORT` - SMTP port (default: 465)
- `TITAN_EMAIL_ADDRESS` - Email address for sending
- `TITAN_EMAIL_PASSWORD` - Email password

### Application URLs (Required)
- `NEXT_PUBLIC_APP_URL` - Your application's public URL
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` - Redirect URL for auth in development
- `NEXT_PUBLIC_FEEDBACK_URL` - Feedback form URL

## Platform-Specific Instructions

### Vercel
1. Go to Project Settings → Environment Variables
2. Add each variable from `.env.example`
3. Select which environments it applies to (Production, Preview, Development)
4. Redeploy your project

### Netlify
1. Go to Site Settings → Build & Deploy → Environment
2. Add each variable
3. Redeploy your site

### Railway
1. Go to your project
2. Select Variables tab
3. Add each variable
4. Redeploy

### Docker/Self-hosted
1. Create a `.env` file with all variables
2. Pass environment variables when running the container:
   \`\`\`bash
   docker run -e NEXT_PUBLIC_SUPABASE_URL=... -e SUPABASE_SERVICE_ROLE_KEY=... your-image
   \`\`\`

## Notes
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser (public)
- Other variables are server-side only and more secure
- Never commit `.env.local` or actual environment variables to version control
- Use `.env.example` as your template for documentation
