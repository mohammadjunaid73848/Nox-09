import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export const metadata = {
  title: "Privacy Policy - Noxy AI",
  description: "Learn how Noxy AI protects your privacy and handles your data.",
}

export default function PrivacyPage() {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy for Noxy AI</h1>
          <p className="text-gray-400">Effective Date: 16_12_2025 | Last Updated: 16_12_2025</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <p className="text-gray-400 mb-4">
              Welcome to Noxy AI (the "Service", "we", "us" or "our"). Your privacy is very important to us. This
              Privacy Policy explains how we collect, use, disclose and protect your personal data when you access or
              use our website at noxyai.com, our blog at blog.noxyai.com, and our community platform at
              community.noxyai.com (collectively, the "Sites"). By using the Sites, you agree to the collection and use
              of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">1. Who we are & Governing law</h2>
            <p className="text-gray-400">
              We are Noxy AI, incorporated and operating in India. We comply with Indian laws and regulations including
              the Digital Personal Data Protection Act, 2023 (DPDPA) and other applicable data protection and
              information technology laws. If you are using our Service from outside India, you may also be subject to
              your local laws. In case of any conflict, our policy and operations will follow Indian law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Our Service is AI-driven</h2>
            <p className="text-gray-400 mb-4">
              Our Service uses artificial intelligence ("AI") technology. Please note:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>
                This is an AI system. Do not attempt to engage in any activity with the AI or in our system that is
                illegal, fraudulent, abusive or in violation of any policy.
              </li>
              <li>
                We reserve the right to terminate your account at any time without warning if we determine that you are
                misusing the Service or violating our terms.
              </li>
              <li>
                Regarding Subscriptions: Under-age students (minors) should not pay using their own payment method.
                Parents or legal guardians must consent and use their payment method, in accordance with their country's
                law.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. What information we collect</h2>
            <p className="text-gray-400 mb-4">
              We collect information that you provide directly when you use our Sites (for example when you create an
              account, contact support, participate in the community). We may also collect technical information
              automatically (for example: device information, browser type, IP address, usage data).
            </p>
            <p className="text-gray-400 mb-4 font-semibold">Important points:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>We do not sell your personal data.</li>
              <li>
                We cannot (and do not) see your individual conversations with the AI in a way that identifies you
                personally.
              </li>
              <li>We use heavy encryption and security safeguards to protect your data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. How we use your information</h2>
            <p className="text-gray-400 mb-4">We use the information we collect for purposes including:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>To operate and maintain the Service.</li>
              <li>To provide customer support (you may contact us at support@noxyai.com).</li>
              <li>To analyse usage, improve our technology and features, and enhance security.</li>
              <li>To notify you of policy changes or Service updates.</li>
              <li>To process and manage payments, billing, and cancellations regarding your subscription.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. When we may share your information</h2>
            <p className="text-gray-400 mb-4">We may share your information in limited circumstances:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>
                With service providers and vendors who assist in operating our Sites, under confidentiality obligations.
              </li>
              <li>If required by law enforcement or government under Indian law, or to respond to legal process.</li>
              <li>
                If we merge with or are acquired by another company; personal information may be transferred as part of
                that transaction (with notice).
              </li>
              <li>We do not sell your personal information to third parties.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Security of your data</h2>
            <p className="text-gray-400 mb-4">We take your data security seriously:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>We use industry-standard encryption for data in transit and at rest.</li>
              <li>We regularly review our security practices.</li>
              <li>
                However, no method of transmission over the Internet or electronic storage is 100% secure. We cannot
                guarantee absolute security.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Your rights under Indian law</h2>
            <p className="text-gray-400 mb-4">Under the DPDPA and related rules, you may have rights such as:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Accessing your personal data that we hold.</li>
              <li>Correcting, updating or erasing your personal data, subject to legal exceptions.</li>
              <li>Withdrawing your consent for certain processing.</li>
            </ul>
            <p className="text-gray-400">
              If you wish to exercise these rights, please contact us at support@noxyai.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Children and under-age users</h2>
            <p className="text-gray-400">
              Our Service is not directed to children under the age of 13. regarding our paid subscriptions, under-age
              students must obtain parental or guardian permission and use a parent/guardian payment method. We do not
              knowingly collect personal data from children without verifiable parental consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Community platform rules</h2>
            <p className="text-gray-400 mb-4">On our community site (community.noxyai.com):</p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>
                You are expected to follow respectful behaviour. Do not use bad language, harassment, hateful speech, or
                any illegal content.
              </li>
              <li>We reserve the right to ban or terminate your account if you violate community policies.</li>
              <li>We may moderate or remove posts and comments that violate our rules.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Payments and Subscriptions</h2>
            <p className="text-gray-400 mb-4">
              We offer paid subscription plans (Monthly and Annual) to access premium features of Noxy AI.
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>Pricing: You can check our current plans and pricing details at noxyai.com/pricing.</li>
              <li>
                Payment Processors: We do not store your full credit card or banking details on our servers. We use
                trusted third-party payment processors to securely handle transactions. We currently use PayPal
                (paypal.com) and PayU (payu.in).
              </li>
              <li>
                Requirements: You will be required to use a valid payment method. Under-age users (minors) must use a
                payment method of a parent/legal guardian, with full approval.
              </li>
              <li>
                Compliance: You must comply with laws applicable in your country of residence regarding digital
                payments.
              </li>
              <li>Rights: We reserve the right to refuse, suspend or cancel subscriptions at our discretion.</li>
            </ul>
            <p className="text-gray-400 mt-4">
              For more information on how our payment partners handle your data, please refer to their specific privacy
              policies listed in Section 15.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Changes to this Privacy Policy</h2>
            <p className="text-gray-400">
              We may update this Privacy Policy at any time (for example, when we add new features, legal requirements
              change, or our business evolves). When we do, we will post the updated policy on our Sites and revise the
              "Last Updated" date at the top. Your continued use of the Service after such changes means you accept the
              revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">12. Termination of accounts & legal action</h2>
            <p className="text-gray-400">
              We may terminate your account without prior warning if we believe you have violated the terms of Service,
              abused the AI, attempted hacking or misuse, or violated any laws. We reserve the right to take legal
              action against individuals or entities who misuse the Service, engage in fraudulent or harmful activity,
              or breach our policies. This applies to both the AI service and our Sites (including blog.noxyai.com and
              community.noxyai.com).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">13. International transfers & data residence</h2>
            <p className="text-gray-400">
              Since we are based in India, data may be processed, stored or transferred to servers in or outside India,
              subject to Indian law and applicable requirements under the DPDPA. If you are outside India, you agree to
              the transfer of your data to India for processing.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">14. GST and taxation</h2>
            <p className="text-gray-400">
              As an Indian-based company, where applicable, our subscriptions or services will include compliance with
              Indian taxation such as Goods and Services Tax (GST). We reserve the right to charge taxes where required
              by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">15. Third-Party Services</h2>
            <p className="text-gray-400 mb-4">
              We use a number of trusted third-party service providers to operate, host, analyze, and secure our
              Service. You should review each provider's own privacy policy to understand how they process data. Some
              key providers we use include:
            </p>
            <ul className="list-disc list-inside text-gray-400 space-y-2 ml-4">
              <li>
                <a href="https://policies.google.com/privacy" className="text-blue-400 hover:text-blue-300">
                  Google — Privacy & Terms – Google Policies
                </a>
              </li>
              <li>
                <a href="https://vercel.com/legal/privacy-policy" className="text-blue-400 hover:text-blue-300">
                  Vercel — Privacy Policy – Vercel
                </a>
              </li>
              <li>
                <a href="https://www.together.ai/privacy" className="text-blue-400 hover:text-blue-300">
                  Together AI — Privacy – Together AI
                </a>
              </li>
              <li>
                <a href="https://supabase.com/privacy" className="text-blue-400 hover:text-blue-300">
                  Supabase — Privacy Policy | Supabase
                </a>
              </li>
              <li>
                <a href="https://cloud.cerebras.ai/privacy" className="text-blue-400 hover:text-blue-300">
                  Cerebras — Privacy Policy | Cerebras Systems Inc.
                </a>
              </li>
              <li>
                <a href="https://www.paypal.com/us/legalhub/privacy-full" className="text-blue-400 hover:text-blue-300">
                  PayPal — Privacy Statement | PayPal
                </a>
              </li>
              <li>
                <a href="https://payu.in/privacy-policy" className="text-blue-400 hover:text-blue-300">
                  PayU — Privacy Policy | PayU
                </a>
              </li>
            </ul>
            <p className="text-gray-400 mt-4">
              By using our Service, you consent to the processing of your data by these third-party providers under
              their respective policies, in addition to our policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">16. Contact us</h2>
            <p className="text-gray-400 mb-4">
              If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us
              at:
            </p>
            <p className="text-gray-400">
              Email: support@noxyai.com
              <br />
              Address: Srinagar Jammu and Kashmir India
            </p>
            <p className="text-gray-400 mt-4">
              Thank you for trusting Noxy AI. We value your privacy, we work to safeguard your data, and we hope you
              enjoy using our service responsibly.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
