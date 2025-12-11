import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

export const metadata = {
  title: "FAQ - Frequently Asked Questions",
  description: "Find answers to common questions about Noxy, our AI chat assistant.",
}

export default function FAQPage() {
  const faqs = [
    {
      question: "What is Noxy?",
      answer:
        "Noxy is an advanced AI chat assistant powered by multiple AI models. It can help you with conversations, answer questions, generate images, write code, and much more.",
    },
    {
      question: "Is Noxy free to use?",
      answer:
        "Yes! Noxy is currently completely free to use. We may introduce optional paid plans with additional features and capabilities in the future, but the core functionality will remain free.",
    },
    {
      question: "What AI models does Noxy use?",
      answer:
        "Noxy is powered by multiple state-of-the-art AI models including Vision Pro, Quantum, Neural Max, Infinity, and Nexus. This multi-model approach ensures you get the best possible responses for different types of tasks.",
    },
    {
      question: "Can I generate images with Noxy?",
      answer:
        "Yes! Noxy includes powerful image generation capabilities. Simply describe what you want to see, and our AI will create stunning visuals for you.",
    },
    {
      question: "Do I need to create an account?",
      answer:
        "You can use Noxy without an account, but creating one allows you to save your chat history and access your conversations from any device. You can sign up with email or Google.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Absolutely. We take your privacy seriously. All conversations are encrypted, and we never share your personal data with third parties. Read our Privacy Policy for more details.",
    },
    {
      question: "Can Noxy help with coding?",
      answer:
        "Yes! Noxy excels at helping with code. It can write code snippets, debug issues, explain complex concepts, and provide best practices for various programming languages and frameworks.",
    },
    {
      question: "What makes Noxy different from other AI assistants?",
      answer:
        "Noxy combines multiple AI models to provide superior responses, includes real-time search capabilities, offers image generation, and features advanced reasoning for complex problem-solving. Plus, it's completely free!",
    },
    {
      question: "Can I use Noxy on mobile devices?",
      answer:
        "Yes! Noxy is fully responsive and works seamlessly on smartphones, tablets, and desktop computers. You can access it from any modern web browser.",
    },
    {
      question: "Will there be paid plans in the future?",
      answer:
        "We may introduce optional paid plans with premium features like higher usage limits, priority access, and advanced capabilities. However, the core Noxy experience will always remain free.",
    },
  ]

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-400">Everything you need to know about Noxy</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-white/5 pb-8">
              <h2 className="text-2xl font-bold mb-4">{faq.question}</h2>
              <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 bg-white/5 rounded-2xl border border-white/10 text-center">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="text-gray-400 mb-6">
            Can't find the answer you're looking for? Feel free to reach out to our support team.
          </p>
          <Button className="bg-white text-black hover:bg-gray-200">Contact Support</Button>
        </div>
      </main>
    </div>
  )
}
