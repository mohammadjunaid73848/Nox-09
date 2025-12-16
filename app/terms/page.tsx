import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export const metadata = {
  title: "Terms and Conditions - Noxy AI",
  description: "Read the terms and conditions for using Noxy AI.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/5 bg-black/80">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4 text-gray-400 hover:text-white">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms and Conditions – Noxy AI</h1>
          <p className="text-gray-400">Effective Date: 16_12_2025 | Last Updated: 16_12_2025</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <p className="text-gray-400 mb-4">
              Welcome to Noxy AI ("Noxy", "we", "our", or "us"). These Terms and Conditions ("Terms") govern your use of
              noxyai.com, blog.noxyai.com, community.noxyai.com, and all related services (collectively, the "Service").
              By using our Service, you agree to these Terms. If you do not agree, please stop using Noxy AI.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">1. About Noxy AI</h2>
            <p className="text-gray-400">
              Noxy AI is an India-based artificial intelligence platform that allows users to interact with AI systems,
              explore technology updates, and connect with our community. Our goal is to make AI useful, safe, and
              accessible while protecting user privacy and promoting responsible usage.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Eligibility</h2>
            <p className="text-gray-400 mb-4">
              You must be at least 13 years old to use Noxy AI. If you are under the legal age to manage your own online
              accounts in your country, you must use Noxy AI under the supervision of a parent or legal guardian.
            </p>
            <p className="text-gray-400">
              Regarding Subscriptions: Minors are not allowed to purchase subscriptions using their own payment method.
              Parents or legal guardians must approve and complete any payment transaction using their own payment
              method, in accordance with local laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. Use of Our Service</h2>
            <p className="text-gray-400 mb-4">By using Noxy AI, you agree to:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Use the AI responsibly and lawfully.</li>
              <li>Not attempt to hack, reverse-engineer, overload, or disrupt our systems.</li>
              <li>Not use the AI to create or spread harmful, illegal, or misleading content.</li>
              <li>Not impersonate any person or entity.</li>
              <li>Respect other users and our team across all Noxy platforms.</li>
            </ul>
            <p className="text-gray-400 mt-4">
              Any violation of these rules may lead to immediate account suspension or termination without prior
              warning. We also reserve the right to take legal action if misuse or illegal activity is detected.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. AI Content Disclaimer</h2>
            <p className="text-gray-400">
              Noxy AI uses artificial intelligence to generate responses, images, and text. While we strive for
              accuracy, AI content may not always be correct, complete, or appropriate. You are responsible for
              verifying the information before acting on it. We are not liable for damages or losses caused by reliance
              on AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Accounts and Security</h2>
            <p className="text-gray-400">
              You are responsible for maintaining the security of your account credentials. If you suspect unauthorized
              access, contact us immediately at support@noxyai.com. We may suspend or delete accounts that appear
              inactive, suspicious, or in violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Payments, Subscriptions, and Billing</h2>
            <p className="text-gray-400 mb-4">
              We offer paid subscription plans (Monthly and Annual) to access premium features of the Service. By
              subscribing, you agree to the following:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>
                Pricing: Our current pricing and plan details are available at noxyai.com/pricing. We reserve the right
                to modify pricing at any time, but we will provide notice before any price changes affect your recurring
                subscription.
              </li>
              <li>
                Payment Processors: We use secure third-party payment processors, including PayPal (paypal.com) and PayU
                (payu.in). By making a payment, you agree to their terms of service and privacy policies.
              </li>
              <li>
                Taxes: All fees are subject to applicable taxes, including Indian Goods and Services Tax (GST), which
                will be calculated based on your location.
              </li>
              <li>
                Cancellations: You may cancel your subscription at any time via your account settings. Your access will
                continue until the end of your current billing cycle.
              </li>
              <li>
                Minors: As stated in Section 2, under-age users must not use their own payment methods. All payments
                must be authorized by a parent or guardian.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Third-Party Services</h2>
            <p className="text-gray-400 mb-4">
              We rely on trusted third-party partners to operate and improve our services. By using Noxy AI, you
              acknowledge that we share necessary data with these partners to function. These include:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>
                <a href="https://policies.google.com/privacy" className="text-blue-400 hover:text-blue-300">
                  Google — https://policies.google.com/privacy
                </a>
              </li>
              <li>
                <a href="https://vercel.com/legal/privacy-policy" className="text-blue-400 hover:text-blue-300">
                  Vercel — https://vercel.com/legal/privacy-policy
                </a>
              </li>
              <li>
                <a href="https://www.together.ai/privacy" className="text-blue-400 hover:text-blue-300">
                  Together AI — https://www.together.ai/privacy
                </a>
              </li>
              <li>
                <a href="https://supabase.com/privacy" className="text-blue-400 hover:text-blue-300">
                  Supabase — https://supabase.com/privacy
                </a>
              </li>
              <li>
                <a href="https://cloud.cerebras.ai/privacy" className="text-blue-400 hover:text-blue-300">
                  Cerebras — https://cloud.cerebras.ai/privacy
                </a>
              </li>
              <li>
                <a href="https://www.paypal.com/us/legalhub/privacy-full" className="text-blue-400 hover:text-blue-300">
                  PayPal — https://www.paypal.com/us/legalhub/privacy-full
                </a>
              </li>
              <li>
                <a href="https://payu.in/privacy-policy" className="text-blue-400 hover:text-blue-300">
                  PayU — https://payu.in/privacy-policy
                </a>
              </li>
            </ul>
            <p className="text-gray-400 mt-4">
              Your use of Noxy AI also means you agree to their privacy and usage policies where relevant.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Data Protection and Privacy</h2>
            <p className="text-gray-400 mb-4">Your privacy is important to us.</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>We follow strong encryption and security standards to protect your data.</li>
              <li>We do not sell or share your personal information with advertisers.</li>
              <li>Please read our full Privacy Policy to understand how we collect, store, and use your data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Community Guidelines (community.noxyai.com)</h2>
            <p className="text-gray-400 mb-4">
              Our community platform is a space to share ideas, ask questions, and connect with others. You agree not
              to:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Use hate speech, harassment, or offensive language.</li>
              <li>Post spam, scams, or misleading information.</li>
              <li>Violate others' intellectual property rights.</li>
              <li>Spread viruses, malware, or harmful content.</li>
            </ul>
            <p className="text-gray-400 mt-4">
              We may ban or suspend your account for violating these rules without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Blog Platform (blog.noxyai.com)</h2>
            <p className="text-gray-400">
              Our blog shares updates, AI news, and insights from the Noxy team. Comments or feedback submitted to our
              blog must be respectful and appropriate. We may moderate or remove content that violates our standards.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Intellectual Property</h2>
            <p className="text-gray-400">
              All materials on Noxy AI, including text, code, graphics, and AI outputs, are protected under applicable
              intellectual property laws. You may not copy, modify, or distribute our content without written
              permission. However, AI-generated outputs created by you for personal or educational use are generally
              yours to keep — unless otherwise stated.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">12. Limitation of Liability</h2>
            <p className="text-gray-400">
              To the fullest extent allowed by law, Noxy AI and its partners are not liable for any indirect,
              incidental, or consequential damages that may arise from your use of our services, including reliance on
              AI-generated content or service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">13. Termination</h2>
            <p className="text-gray-400 mb-4">
              We may suspend or terminate your account or access to the Service at any time, without prior warning, for
              any reason, including but not limited to:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Policy or legal violations</li>
              <li>Misuse of the AI or system</li>
              <li>Fraudulent activity</li>
              <li>Threats to our platform or community</li>
            </ul>
            <p className="text-gray-400 mt-4">
              If terminated, you must immediately stop using all Noxy AI services. We reserve the right to pursue legal
              action if needed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">14. Changes to These Terms</h2>
            <p className="text-gray-400">
              We may update or modify these Terms from time to time. When we make changes, we'll update the "Effective
              Date" and post the revised version on our website. Continued use of the Service means you accept the new
              Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">15. Governing Law</h2>
            <p className="text-gray-400">
              These Terms are governed by the laws of India, including all applicable Information Technology, GST, and
              Digital Personal Data Protection Act (DPDPA) regulations. Any disputes shall be handled in the
              jurisdiction of Srinagar, Jammu & Kashmir, India.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">16. Contact Us</h2>
            <p className="text-gray-400 mb-4">
              If you have any questions, complaints, or feedback regarding these Terms, please contact us:
            </p>
            <p className="text-gray-400">
              Email: support@noxyai.com
              <br />
              Website: https://noxyai.com
              <br />
              Location: India
            </p>
            <p className="text-gray-400 mt-4">
              By using Noxy AI, you acknowledge that you have read, understood, and agreed to these Terms and
              Conditions.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
