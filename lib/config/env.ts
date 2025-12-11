/**
 * Centralized Environment Variables Configuration
 * All variables are loaded from process.env with built-in defaults
 * This ensures deployment works automatically without manual setup
 */

export const config = {
  // Supabase Configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key",
    postgresUrl: process.env.SUPABASE_POSTGRES_URL || "",
    postgresPrismaUrl: process.env.SUPABASE_POSTGRES_PRISMA_URL || "",
    postgresUrlNonPooling: process.env.SUPABASE_POSTGRES_URL_NON_POOLING || "",
    postgresUser: process.env.SUPABASE_POSTGRES_USER || "",
    postgresPassword: process.env.SUPABASE_POSTGRES_PASSWORD || "",
    postgresDatabase: process.env.SUPABASE_POSTGRES_DATABASE || "",
    postgresHost: process.env.SUPABASE_POSTGRES_HOST || "",
    anonKeyAlt: process.env.SUPABASE_ANON_KEY || "",
  },

  // Google Search Configuration
  google: {
    cseApiKey: process.env.GOOGLE_CSE_API_KEY || "",
    cseId: process.env.GOOGLE_CSE_CX || "",
    get isConfigured() {
      return !!this.cseApiKey && !!this.cseId
    },
  },

  // AI & API Keys
  apis: {
    togetherApiKey: process.env.TOGETHER_API_KEY || "",
    groqApiKey: process.env.GROQ_API_KEY || "",
    cerebrasApiKey: process.env.CEREBRAS_API_KEY || "",
    huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY || "",
    noxyaiApiKey: process.env.NOXYAI_API_KEY || "",
    gnewsApiKey: process.env.GNEWS_API_KEY || "demo",
  },

  // Email Configuration
  email: {
    smtpHost: process.env.TITAN_SMTP_HOST || "smtp.titan.email",
    smtpPort: Number.parseInt(process.env.TITAN_SMTP_PORT || "465", 10),
    address: process.env.TITAN_EMAIL_ADDRESS || "noreply@noxyai.com",
    password: process.env.TITAN_EMAIL_PASSWORD || "",
    get isConfigured() {
      return !!this.address && !!this.password
    },
  },

  // Application URLs
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    devSupabaseRedirectUrl: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "http://localhost:3000/auth/confirm",
    feedbackUrl: process.env.NEXT_PUBLIC_FEEDBACK_URL || "https://forms.gle/your-feedback-form",
  },

  // Environment detection
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
}

export const supabaseConfig = config.supabase
export const googleConfig = config.google
export const apiConfig = config.apis
export const emailConfig = config.email
export const appConfig = config.app
