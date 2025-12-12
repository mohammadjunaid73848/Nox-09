"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Menu,
  Zap,
  ArrowRight,
  User,
  Cpu,
  ArrowUpRight,
  ArrowUp,
  Mic,
  Users,
  MoreHorizontal,
  Check,
} from "lucide-react"

export function Homepage() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [thinkAnimationStarted, setThinkAnimationStarted] = useState(false)
  const [avatarAnimationStarted, setAvatarAnimationStarted] = useState(false)
  const [thinkState, setThinkState] = useState<"processing" | "content">("processing")
  const [typeHeading, setTypeHeading] = useState("")
  const [typeBody, setTypeBody] = useState("")
  const [showFooter, setShowFooter] = useState(false)
  const [avatarInput, setAvatarInput] = useState("")
  const [avatarMessages, setAvatarMessages] = useState<{ type: "user" | "bot" | "typing"; text: string }[]>([])
  const [isSearchTransitioning, setIsSearchTransitioning] = useState(false)
  const thinkSectionRef = useRef<HTMLElement>(null)
  const avatarSectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    // Create falling stars - exactly as in original HTML
    const starContainer = document.getElementById("star-container")
    if (starContainer) {
      starContainer.innerHTML = ""
      const starCount = 15
      for (let i = 0; i < starCount; i++) {
        const star = document.createElement("div")
        star.className = "star"
        const x = Math.random() * 100 + "vw"
        const delay = Math.random() * 5 + "s"
        const duration = Math.random() * 7 + 8 + "s"
        const size = Math.random() * 2 + 2 + "px"
        star.style.setProperty("--start-x", x)
        star.style.setProperty("--delay", delay)
        star.style.setProperty("--duration", duration)
        star.style.width = size
        star.style.height = size
        starContainer.appendChild(star)
      }
    }

    createPixelGrid("pixel-grid-1", 220)
    createPixelGrid("pixel-grid-2", 250)
    createPixelGrid("pixel-grid-3", 230)

    // Scroll reveal observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active")

            if (entry.target.id === "think-section" && !thinkAnimationStarted) {
              setThinkAnimationStarted(true)
              startThinkAnimation()
            }

            if (entry.target.id === "avatar-section" && !avatarAnimationStarted) {
              setAvatarAnimationStarted(true)
              startAvatarSimulation()
            }
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    )

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [thinkAnimationStarted, avatarAnimationStarted])

  function createPixelGrid(containerId: string, speed = 220) {
    const container = document.getElementById(containerId)
    if (!container) return

    const rows = 3
    const cols = 20
    let step = 0

    // Create grid with larger pixels and better spacing
    let html = '<div class="flex flex-col gap-1.5 mt-3">'
    for (let r = 0; r < rows; r++) {
      html += '<div class="flex gap-1">'
      for (let c = 0; c < cols; c++) {
        html += `<div class="w-1.5 h-2 rounded-sm bg-neutral-800" style="transition: all 0.3s ease-out;" id="${containerId}-r${r}-c${c}"></div>`
      }
      html += "</div>"
    }
    html += "</div>"
    container.innerHTML = html

    setInterval(() => {
      step = (step + 1) % (cols + 6)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const el = document.getElementById(`${containerId}-r${r}-c${c}`)
          if (!el) continue

          const distanceFromHead = step - 1 - c
          const isActive = c < step && distanceFromHead >= 0
          const isHead = c === step - 1
          const isTail = distanceFromHead > 4

          // Smooth gradient from head to tail
          let bgColor = "rgb(38, 38, 38)" // neutral-800
          let boxShadow = "none"
          let opacity = "1"

          if (isActive) {
            if (isHead) {
              // Bright orange head with glow
              bgColor = r === 1 ? "rgb(251, 146, 60)" : "rgb(249, 115, 22)" // orange-400 / orange-500
              boxShadow = "0 0 8px rgba(251, 146, 60, 0.8)"
            } else if (distanceFromHead <= 2) {
              // Near head - bright
              bgColor = r === 1 ? "rgb(234, 88, 12)" : "rgb(194, 65, 12)" // orange-600 / orange-700
              boxShadow = "0 0 4px rgba(251, 146, 60, 0.4)"
            } else if (distanceFromHead <= 4) {
              // Mid section - medium
              bgColor = "rgb(154, 52, 18)" // orange-800
              opacity = "0.8"
            } else if (!isTail) {
              // Far from head - dim
              bgColor = "rgb(124, 45, 18)" // orange-900
              opacity = "0.5"
            } else {
              // Tail - fading out
              bgColor = "rgb(68, 68, 68)" // neutral-700
              opacity = "0.3"
            }
          }

          el.style.backgroundColor = bgColor
          el.style.boxShadow = boxShadow
          el.style.opacity = opacity
        }
      }
    }, speed)
  }

  // Think Section Animation
  function startThinkAnimation() {
    setTimeout(() => {
      setThinkState("content")

      const headingText = "The Question of Purpose"
      const bodyText =
        "The question \"What is the meaning of life?\" is one that has puzzled humanity for centuries. It's not something that comes with a single, universal answer. Instead, it's a deeply personal and complex idea that looks very different depending on who's asking."

      let i = 0
      function typeHeadingFn() {
        if (i < headingText.length) {
          setTypeHeading((prev) => prev + headingText.charAt(i))
          i++
          setTimeout(typeHeadingFn, 50)
        } else {
          i = 0
          setTimeout(typeBodyFn, 300)
        }
      }

      function typeBodyFn() {
        if (i < bodyText.length) {
          setTypeBody((prev) => prev + bodyText.charAt(i))
          i++
          setTimeout(typeBodyFn, 20)
        } else {
          setTimeout(() => setShowFooter(true), 500)
        }
      }

      typeHeadingFn()
    }, 2000)
  }

  // Avatar Chat Simulation
  function startAvatarSimulation() {
    const userMessage = "hi Albert Einstein tell me e=mc²"
    let i = 0

    setTimeout(() => {
      const typeInterval = setInterval(() => {
        setAvatarInput((prev) => prev + userMessage.charAt(i))
        i++
        if (i >= userMessage.length) {
          clearInterval(typeInterval)

          setTimeout(() => {
            setAvatarInput("")
            setAvatarMessages([{ type: "user", text: userMessage }])

            setTimeout(() => {
              setAvatarMessages((prev) => [...prev, { type: "typing", text: "" }])

              setTimeout(() => {
                setAvatarMessages([
                  { type: "user", text: userMessage },
                  {
                    type: "bot",
                    text: "Ah, relativity! 🧠 <br/><br/> In simple terms, <b>E = mc²</b> means that energy (E) and mass (m) are interchangeable; they are different forms of the same thing. <br/><br/>Even a tiny amount of mass contains a tremendous amount of energy because the speed of light (c) is such a huge number!",
                  },
                ])
              }, 1500)
            }, 500)
          }, 800)
        }
      }, 80)
    }, 1000)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      setIsSearchTransitioning(true)
      // Wait for animation then redirect
      setTimeout(() => {
        router.push(`/chat?q=${encodeURIComponent(searchInput.trim())}`)
      }, 400)
    } else {
      router.push("/chat")
    }
  }

  return (
    <div
      className="antialiased selection:bg-white selection:text-black bg-black text-white overflow-x-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Navigation */}
      <nav
        className="fixed top-0 w-full z-50 glass-panel border-b border-[#333333]/30 transition-all duration-300 bg-black/80 backdrop-blur-md"
        id="navbar"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <img
              src="https://www.noxyai.com/logo-black.png"
              alt="Noxy Logo"
              className="w-8 h-8 object-contain"
              style={{ filter: "invert(1)" }}
            />
            <span className="font-semibold text-xl tracking-tight hidden sm:block">Noxyai</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#888888]">
              <a href="/pricing" className="hover:text-white transition-colors">
                Pricing
              </a>
              <a href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="/terms" className="hover:text-white transition-colors">
                Terms
              </a>
              <a href="/auth/email/signin" className="hover:text-white transition-colors">
                Login
              </a>
            </div>

            <button
              className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold btn-glow flex items-center gap-2"
              onClick={() => router.push("/auth")}
            >
              Try Free
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              className="p-2 text-white md:hidden hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div
          className={`${mobileMenuOpen ? "flex" : "hidden"} md:hidden absolute top-16 left-0 w-full bg-black border-b border-[#333333]/30 p-4 flex-col gap-4 animate-fade-in-up`}
        >
          <a href="/pricing" className="text-[#888888] hover:text-white text-lg font-medium py-2">
            Pricing
          </a>
          <a href="/privacy" className="text-[#888888] hover:text-white text-lg font-medium py-2">
            Privacy
          </a>
          <a href="/terms" className="text-[#888888] hover:text-white text-lg font-medium py-2">
            Terms
          </a>
          <a href="/auth/email/signin" className="text-[#888888] hover:text-white text-lg font-medium py-2">
            Login
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-[90vh] flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Star Background Container */}
        <div id="star-container" className="absolute inset-0 pointer-events-none z-0"></div>

        {/* Glowing Background Animation */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-black to-black opacity-40 z-0 pointer-events-none animate-pulse-slow"></div>

        {/* Large Spotlight Text Background */}
        <div className="absolute top-[75%] md:top-[70%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 w-full text-center pointer-events-none select-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[40vw] bg-white/10 blur-[120px] rounded-full pointer-events-none"></div>
          <h1 className="text-[15vw] md:text-[18vw] font-bold leading-none tracking-tighter spotlight-text opacity-80 blur-sm md:blur-0 relative z-10">
            NOXYAI
          </h1>
        </div>

        <div
          className={`w-full max-w-2xl relative z-10 animate-fade-in-up mt-[-10vh] md:mt-0 transition-all duration-400 ${isSearchTransitioning ? "opacity-0 scale-95 translate-y-4" : ""}`}
        >
          <div className="glass-panel rounded-2xl p-1 mb-8 shadow-2xl shadow-white/5 backdrop-blur-xl">
            <form onSubmit={handleSearchSubmit} className="bg-black/80 rounded-xl flex items-start p-4 gap-3">
              <div className="flex-1 max-h-32 overflow-y-auto scrollbar-thin">
                <textarea
                  placeholder="What do you want to know?"
                  className="bg-transparent text-lg text-white placeholder-[#888888] w-full focus:outline-none font-light resize-none min-h-[28px]"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value)
                    e.target.style.height = "28px"
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSearchSubmit(e as unknown as React.FormEvent)
                    }
                  }}
                  rows={1}
                  style={{ height: "28px" }}
                />
              </div>
              <button
                type="submit"
                className="bg-[#111111] p-2 rounded-full hover:bg-[#333333] transition-colors group flex-shrink-0 mt-0.5"
              >
                <ArrowUp className="w-5 h-5 text-white group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* SuperNoxy Section */}
      <section className="py-24 border-t border-[#333333]/20 relative overflow-hidden reveal z-10 bg-black">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#333333]/50 bg-[#111111]/50 mb-6">
            <Zap className="w-4 h-4 text-white" />
            <span className="text-xs font-mono text-white">INTRODUCING SUPERNOXY</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-semibold mb-6 tracking-tight">Do more with Noxyai.</h2>
          <p className="text-xl text-[#888888] mb-10 max-w-2xl mx-auto">
            Unlock a SuperNoxy subscription on Noxyai.com. We've just launched SuperNoxy, providing access to our most
            capable reasoning models.
          </p>

          <button
            className="group bg-transparent text-white px-8 py-3 rounded-full font-medium btn-glow flex items-center gap-2 mx-auto"
            onClick={() => router.push("/auth")}
          >
            Sign Up Now
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* SuperNoxy Modern Deep Dive */}
      <section className="py-24 border-t border-[#333333]/20 bg-[#0a0a0a] reveal z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-5xl font-semibold mb-2">Deep dive with</h3>
            <h3 className="text-3xl md:text-5xl font-semibold mb-6 text-[#888888]">SuperNoxy Heavy</h3>
            <p className="text-[#888888] text-lg mb-8 max-w-xl mx-auto">
              The most powerful version of Noxy. Visualizing complex reasoning paths in real-time.
            </p>
            <button
              className="px-5 py-2 rounded-full border border-neutral-800 text-[10px] font-bold tracking-widest uppercase hover:bg-neutral-900 transition-colors btn-glow"
              onClick={() => router.push("/chat")}
            >
              Dive Deep ↗
            </button>
          </div>

          {/* Visualization Container */}
          <div className="w-full max-w-4xl relative">
            {/* Top User Node */}
            <div className="flex flex-col items-center mb-6 relative z-20">
              <div className="w-10 h-10 rounded-full border border-neutral-700 bg-neutral-900 flex items-center justify-center text-neutral-400">
                <User className="w-5 h-5" />
              </div>
              <div className="w-px h-8 bg-neutral-800"></div>
            </div>

            <div className="relative">
              {/* Main Processing Node */}
              <div className="relative z-10 w-full max-w-md mx-auto">
                <div className="bg-neutral-900/80 border border-neutral-800 rounded-lg p-5 backdrop-blur-md shadow-2xl">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-sm font-bold text-white tracking-wide">Supernoxy Heavy</h3>
                    <Cpu className="w-4 h-4 text-neutral-500" />
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                      </span>
                      <span className="text-xs font-bold text-neutral-300 tracking-wider">PROCESSING</span>
                    </div>
                    <span className="text-xs font-mono text-neutral-500">- 05 MIN LEFT</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-px mt-4 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500 to-transparent w-1/2 animate-shimmer"></div>
                  </div>
                </div>
                <div className="absolute -bottom-6 left-1/2 w-px h-6 bg-neutral-800 -translate-x-1/2 hidden md:block"></div>
              </div>

              {/* Branching Lines */}
              <div className="hidden md:block py-6">
                <div className="w-[66%] mx-auto h-px bg-neutral-800 relative top-0"></div>
              </div>

              {/* Agents Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 mt-6 md:mt-0 relative z-10">
                {/* Agent 1 */}
                <div className="relative group">
                  <div className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 backdrop-blur-sm hover:border-neutral-700 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                          AGENT 1
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500">- 03 MIN LEFT</span>
                    </div>
                    <div className="mb-4">
                      <span className="text-xs font-medium text-neutral-300 tracking-wide">
                        ANALYZING DATA PATTERNS
                      </span>
                    </div>
                    <div id="pixel-grid-1"></div>
                  </div>
                  <div className="absolute -top-6 left-1/2 w-px h-6 bg-neutral-800 -translate-x-1/2 hidden md:block"></div>
                </div>

                {/* Agent 2 */}
                <div className="relative group">
                  <div className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 backdrop-blur-sm hover:border-neutral-700 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                          AGENT 2
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500">- 05 MIN LEFT</span>
                    </div>
                    <div className="mb-4">
                      <span className="text-xs font-medium text-neutral-300 tracking-wide">SYNTHESIZING OUTPUT</span>
                    </div>
                    <div id="pixel-grid-2"></div>
                  </div>
                  <div className="absolute -top-6 left-1/2 w-px h-6 bg-neutral-800 -translate-x-1/2 hidden md:block"></div>
                </div>

                {/* Agent 3 */}
                <div className="relative group">
                  <div className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 backdrop-blur-sm hover:border-neutral-700 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                          AGENT 3
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500">- 04 MIN LEFT</span>
                    </div>
                    <div className="mb-4">
                      <span className="text-xs font-medium text-neutral-300 tracking-wide">VALIDATING RESULTS</span>
                    </div>
                    <div id="pixel-grid-3"></div>
                  </div>
                  <div className="absolute -top-6 left-1/2 w-px h-6 bg-neutral-800 -translate-x-1/2 hidden md:block"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Power Simulator Section */}
      <section className="py-24 border-t border-[#333333]/20 reveal z-10 bg-black">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          {/* Modern Power Simulator */}
          <div className="order-2 md:order-1 relative w-full h-[500px] flex items-center justify-center overflow-hidden rounded-2xl glass-panel border border-noxy-border/30">
            {/* Background Grid */}
            <div
              className="absolute inset-0 z-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(circle at center, #333 1px, transparent 1px)",
                backgroundSize: "30px 30px",
              }}
            ></div>

            <svg
              className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-0"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <g className="stroke-gray-800" style={{ strokeWidth: "0.5px" }}>
                <path d="M 18,18 L 50,50" />
                <path d="M 82,18 L 50,50" />
                <path d="M 82,82 L 50,50" />
                <path d="M 18,82 L 50,50" />
              </g>
              <g className="stroke-white fill-none animate-flow" filter="url(#glow)" style={{ strokeWidth: "0.5px" }}>
                <path d="M 18,18 L 50,50" />
                <path d="M 82,18 L 50,50" />
                <path d="M 82,82 L 50,50" />
                <path d="M 18,82 L 50,50" />
              </g>
            </svg>

            <div className="absolute top-1/2 left-1/2 w-48 h-48 border border-gray-700 rounded-full ring-spin z-0 opacity-50 border-dashed"></div>

            <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-black border-2 border-white z-20 core-pulse flex items-center justify-center overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
              <div className="w-16 h-16 relative">
                <img
                  src="https://www.noxyai.com/logo-black.png"
                  className="w-full h-full object-contain invert drop-shadow-[0_0_10px_white]"
                  alt="Noxyai"
                />
              </div>
            </div>

            <div className="absolute top-[18%] left-[18%] -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center node-wrapper group">
              <div className="w-12 h-12 rounded-full p-1 bg-black border border-gray-600 group-hover:border-white group-hover:shadow-[0_0_20px_white] transition-all duration-300">
                <div className="w-full h-full rounded-full overflow-hidden bg-white">
                  <img
                    src="https://ttknudwab0r5uvx6.public.blob.vercel-storage.com/images%20%283%29.jpeg"
                    alt="ChatGPT"
                    className="logo-img"
                  />
                </div>
              </div>
              <span className="mt-2 text-[8px] font-bold tracking-[0.2em] text-gray-500 group-hover:text-white transition-colors">
                CHATGPT
              </span>
            </div>

            <div className="absolute top-[18%] left-[82%] -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center node-wrapper group">
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center group-hover:shadow-[0_0_20px_white] transition-all duration-300">
                <div className="w-full h-full rounded-full overflow-hidden bg-white p-3">
                  <img
                    src="https://ttknudwab0r5uvx6.public.blob.vercel-storage.com/images.png"
                    alt="Nvidia"
                    className="logo-img-contain"
                  />
                </div>
              </div>
              <span className="mt-2 text-[8px] font-bold tracking-[0.2em] text-gray-500 group-hover:text-white transition-colors">
                NVIDIA
              </span>
            </div>

            <div className="absolute top-[82%] left-[82%] -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center node-wrapper group">
              <div className="w-12 h-12 rounded-full p-1 bg-black border border-gray-600 group-hover:border-white group-hover:shadow-[0_0_20px_white] transition-all duration-300">
                <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg"
                    alt="Meta"
                    className="w-6 h-6 meta-logo filter grayscale brightness-200 transition-all duration-300"
                  />
                </div>
              </div>
              <span className="mt-2 text-[8px] font-bold tracking-[0.2em] text-gray-500 group-hover:text-white transition-colors">
                META
              </span>
            </div>

            <div className="absolute top-[82%] left-[18%] -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center node-wrapper group">
              <div className="w-12 h-12 rounded-full p-1 bg-black border border-gray-600 group-hover:border-white group-hover:shadow-[0_0_20px_white] transition-all duration-300">
                <div className="w-full h-full rounded-full overflow-hidden bg-white p-2">
                  <img
                    src="https://ttknudwab0r5uvx6.public.blob.vercel-storage.com/Grok-Logo.png"
                    alt="Grok"
                    className="logo-img-contain"
                  />
                </div>
              </div>
              <span className="mt-2 text-[8px] font-bold tracking-[0.2em] text-gray-500 group-hover:text-white transition-colors">
                GROK
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Noxy Think Section */}
      <section
        className="py-24 border-t border-[#333333]/20 reveal z-10 bg-black"
        id="think-section"
        ref={thinkSectionRef}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="glass-panel p-8 rounded-2xl border border-[#333333]/30 hover:border-white/20 transition-colors duration-500 h-[420px] flex flex-col relative overflow-hidden">
            {/* Processing State */}
            {thinkState === "processing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="font-mono text-sm text-[#888888] animate-pulse">Processing query...</span>
              </div>
            )}

            {/* Content State */}
            {thinkState === "content" && (
              <div className="h-full flex flex-col justify-start pt-16">
                <div className="flex items-center gap-3 mb-6 absolute top-8 left-8">
                  <div className="bg-green-900/30 p-1.5 rounded-full">
                    <Check className="text-green-500 w-4 h-4" />
                  </div>
                  <span className="font-mono text-sm text-[#888888]">Thought for 5 seconds</span>
                </div>

                <div className="opacity-100 transition-all duration-700 mt-4">
                  <h4 className="text-xl font-medium mb-4">{typeHeading}</h4>
                  <p className="text-[#888888] leading-relaxed mb-4">{typeBody}</p>

                  <div
                    className={`pl-4 border-l-2 border-[#333333] transition-opacity duration-1000 ${showFooter ? "opacity-100" : "opacity-0"}`}
                  >
                    <p className="text-sm text-[#888888] italic">
                      <span className="text-white font-medium block mb-1 not-italic">Philosophical Views</span>
                      Some philosophers, like existentialists, suggest that life doesn't come with built-in meaning.
                      Instead, it's up to us to create our own purpose through our choices.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-12">
            <div className="h-8 w-1 bg-white mb-6"></div>
            <h3 className="text-3xl md:text-5xl font-semibold mb-2">Find meaning with</h3>
            <h3 className="text-3xl md:text-5xl font-semibold mb-6 text-[#888888]">Noxy Think</h3>
            <p className="text-[#888888] max-w-xl mb-8">
              Discover profound insights with Noxy Think, connecting dots and revealing truths in complex ideas.
            </p>
            <button
              className="border border-[#333333] px-6 py-2 rounded-full text-sm uppercase tracking-wider hover:bg-white hover:text-black transition-all btn-glow"
              onClick={() => router.push("/chat")}
            >
              Find Answers ↗
            </button>
          </div>
        </div>
      </section>

      {/* Noxy Voice Section */}
      <section className="py-24 border-t border-[#333333]/20 bg-gradient-to-b from-black to-[#0a0a0a] reveal z-10">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="h-8 w-1 bg-white mb-6"></div>
            <h3 className="text-3xl md:text-5xl font-semibold mb-2">Talk with</h3>
            <h3 className="text-3xl md:text-5xl font-semibold mb-6 text-[#888888]">Noxy Voice</h3>
            <p className="text-[#888888] text-lg mb-8">
              Engage in seamless conversations with Noxy Voice, experiencing natural, fluid dialogue like never before.
            </p>
            <button
              className="border border-[#333333] px-6 py-2 rounded-full text-sm uppercase tracking-wider hover:bg-white hover:text-black transition-all btn-glow"
              onClick={() => router.push("/voice")}
            >
              Start Talking ↗
            </button>
          </div>

          {/* Voice Visualizer */}
          <div className="h-80 flex flex-col items-center justify-center relative">
            <div className="absolute inset-0 bg-purple-900/20 blur-[100px] rounded-full animate-pulse-slow"></div>

            <button
              className="w-14 h-14 rounded-full border border-[#333333] flex items-center justify-center mb-8 hover:scale-110 transition duration-300 bg-white/5"
              onClick={() => router.push("/voice")}
            >
              <Mic className="w-6 h-6 text-white" />
            </button>

            <span className="text-[#888888] text-sm mb-8 font-medium tracking-widest uppercase">Listening...</span>

            <div className="flex items-end gap-1.5 h-16">
              <div
                className="w-1.5 bg-gradient-to-t from-pink-500 to-white rounded-full animate-bar-dance"
                style={{ animationDuration: "0.8s", animationDelay: "0s" }}
              ></div>
              <div
                className="w-1.5 bg-gradient-to-t from-pink-500 to-white rounded-full animate-bar-dance"
                style={{ animationDuration: "1.2s", animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-1.5 bg-gradient-to-t from-pink-500 to-white rounded-full animate-bar-dance"
                style={{ animationDuration: "0.5s", animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-1.5 bg-gradient-to-t from-pink-500 to-white rounded-full animate-bar-dance"
                style={{ animationDuration: "0.9s", animationDelay: "0.3s" }}
              ></div>
              <div
                className="w-1.5 bg-gradient-to-t from-pink-500 to-white rounded-full animate-bar-dance"
                style={{ animationDuration: "0.6s", animationDelay: "0.4s" }}
              ></div>
              <div
                className="w-1.5 bg-gradient-to-t from-pink-500 to-white rounded-full animate-bar-dance"
                style={{ animationDuration: "1.1s", animationDelay: "0.5s" }}
              ></div>
            </div>

            <p className="mt-8 text-lg font-medium text-white/90">"How's it going? I was just thinking..."</p>
          </div>
        </div>
      </section>

      {/* Image Generation Section */}
      <section className="py-24 border-t border-[#333333]/20 reveal z-10 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <span className="mono-label block mb-4">[ IMAGE GENERATION ]</span>
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-3xl md:text-5xl font-semibold">Transform text into visual realities</h2>
            <button
              className="hidden md:flex border border-[#333333] px-6 py-2 rounded-full text-sm uppercase tracking-wider hover:bg-white hover:text-black transition-all btn-glow"
              onClick={() => router.push("/image")}
            >
              Create Images ↗
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Card 1 */}
            <div
              className="group relative overflow-hidden rounded-xl bg-[#111111] border border-[#333333]/30 cursor-pointer"
              onClick={() => router.push("/image")}
            >
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src="https://ttknudwab0r5uvx6.public.blob.vercel-storage.com/noxyai_1764775234242.png"
                  alt="Futuristic City"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-4 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent pt-12">
                <p className="text-sm text-[#888888] font-mono">
                  Generate a high-quality image of a futuristic city at night
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div
              className="group relative overflow-hidden rounded-xl bg-[#111111] border border-[#333333]/30 cursor-pointer"
              onClick={() => router.push("/image")}
            >
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src="https://ttknudwab0r5uvx6.public.blob.vercel-storage.com/noxyai_1764775437919.png"
                  alt="Cyberpunk Girl"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-4 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent pt-12">
                <p className="text-sm text-[#888888] font-mono">
                  Cyberpunk girl with blue hair standing in rain, dramatic lighting
                </p>
              </div>
            </div>
          </div>

          <button
            className="md:hidden w-full mt-8 border border-[#333333] px-6 py-3 rounded-full text-sm uppercase tracking-wider hover:bg-white hover:text-black transition-all btn-glow"
            onClick={() => router.push("/image")}
          >
            Create Images ↗
          </button>
        </div>
      </section>

      {/* Avatar Store Section */}
      <section
        className="py-24 border-t border-[#333333]/20 reveal z-10 bg-black"
        id="avatar-section"
        ref={avatarSectionRef}
      >
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#333333]/50 bg-[#111111]/50 mb-6">
              <Users className="w-4 h-4 text-white" />
              <span className="text-xs font-mono text-white">AVATAR STORE</span>
            </div>
            <h3 className="text-3xl md:text-5xl font-semibold mb-6">Create your own avatar</h3>
            <p className="text-[#888888] text-lg mb-8">
              Design custom personalities or chat with legendary figures. Publish your characters to the Avatar Store
              and share them with the world.
            </p>
            <div className="glass-panel p-4 rounded-xl border border-[#333333]/50 inline-block mb-8">
              <span className="text-xs text-[#888888] font-mono block mb-2">SYSTEM PROMPT</span>
              <p className="font-mono text-sm text-white">"Behave like Albert Einstein"</p>
            </div>
            <div>
              <button
                className="bg-white text-black px-6 py-3 rounded-full font-bold text-sm hover:bg-gray-200 transition-colors btn-glow"
                onClick={() => router.push("/avatar")}
              >
                Visit Store ↗
              </button>
            </div>
          </div>

          {/* Avatar Chat Simulation */}
          <div className="glass-panel rounded-2xl border border-[#333333]/50 overflow-hidden min-h-[400px] flex flex-col relative">
            {/* Header */}
            <div className="p-4 border-b border-[#333333]/30 flex items-center justify-between bg-[#111111]/80 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Albert_Einstein_Head.jpg/800px-Albert_Einstein_Head.jpg"
                    alt="Einstein"
                    className="w-full h-full object-cover grayscale"
                  />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Albert Einstein</h4>
                  <span className="text-[10px] text-green-500 font-mono">ONLINE</span>
                </div>
              </div>
              <button className="p-2 hover:bg-white/10 rounded-full transition">
                <MoreHorizontal className="w-4 h-4 text-[#888888]" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto" id="avatar-chat-area">
              {avatarMessages.map((msg, i) => {
                if (msg.type === "typing") {
                  return (
                    <div key={i} className="self-start bg-white/5 rounded-full px-3 py-2 flex gap-1">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                      <div
                        className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  )
                }
                if (msg.type === "user") {
                  return (
                    <div
                      key={i}
                      className="self-end bg-[#111111] border border-[#333333] px-4 py-2 rounded-2xl rounded-tr-none text-white max-w-[85%] text-sm animate-pop-in"
                    >
                      {msg.text}
                    </div>
                  )
                }
                return (
                  <div
                    key={i}
                    className="self-start bg-white text-black px-4 py-3 rounded-2xl rounded-tl-none max-w-[90%] text-sm font-medium animate-pop-in shadow-lg shadow-white/5"
                    dangerouslySetInnerHTML={{ __html: msg.text }}
                  />
                )
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[#333333]/30 bg-[#111111]/50">
              <div className="bg-black/50 border border-[#333333]/50 rounded-full px-4 py-2 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="bg-transparent text-sm w-full focus:outline-none text-white"
                  value={avatarInput}
                  readOnly
                />
                <button className="p-1.5 bg-white text-black rounded-full hover:bg-gray-200 transition">
                  <ArrowUp className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Area */}
      <section className="py-24 border-t border-[#333333]/20 reveal z-10 bg-black">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-2xl font-semibold mb-8 text-left">Available anywhere.</h3>

          {/* Simplified Buttons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-24">
            <button
              className="bg-white text-black py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-gray-200 transition btn-glow"
              onClick={() => router.push("/chat")}
            >
              Noxy Web ↗
            </button>
            <button
              className="bg-transparent border border-[#333333] text-white py-4 rounded-full font-bold text-sm uppercase tracking-widest hover:bg-[#333333] transition btn-glow"
              onClick={() => window.open("https://dev.noxyai.com", "_blank")}
            >
              Try API ↗
            </button>
          </div>
        </div>

        {/* Footer Links */}
        <footer className="max-w-7xl mx-auto px-6 border-t border-[#333333]/20 pt-16 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div>
              <h5 className="mono-label mb-6 text-[#888888]">PRODUCT</h5>
              <ul className="space-y-4 text-sm font-medium">
                <li>
                  <a href="https://dev.noxyai.com" className="hover:text-white text-[#888888] transition">
                    Try API
                  </a>
                </li>
                <li>
                  <a href="https://blog.noxyai.com" className="hover:text-white text-[#888888] transition">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="/auth" className="hover:text-white text-[#888888] transition">
                    SuperNoxy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="mono-label mb-6 text-[#888888]">LEGAL</h5>
              <ul className="space-y-4 text-sm font-medium">
                <li>
                  <a href="/privacy" className="hover:text-white text-[#888888] transition">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="hover:text-white text-[#888888] transition">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/refund" className="hover:text-white text-[#888888] transition">
                    Refund Policy
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="mono-label mb-6 text-[#888888]">COMMUNITY</h5>
              <ul className="space-y-4 text-sm font-medium">
                <li>
                  <a href="https://community.noxyai.com" className="hover:text-white text-[#888888] transition">
                    Community
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.reddit.com/u/officialnoxyai/s/CWF3PNl3z6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white text-[#888888] transition"
                  >
                    Reddit
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="mono-label mb-6 text-[#888888]">SOCIAL</h5>
              <ul className="space-y-4 text-sm font-medium">
                <li>
                  <a
                    href="https://x.com/Noxyaiofficial?t=yqX9DNkRAMy_xZWZmhZ_QQ&s=09"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white text-[#888888] transition"
                  >
                    X (Twitter)
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.instagram.com/officialnoxyai?igsh=ZTlqYXFudW5ja296"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white text-[#888888] transition"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://youtube.com/@noxyai?si=74mYFgM3dUH05IRe"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white text-[#888888] transition"
                  >
                    YouTube
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-[#888888]">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <img
                src="https://www.noxyai.com/logo-black.png"
                alt="Noxy Logo"
                className="w-6 h-6 object-contain"
                style={{ filter: "invert(1)" }}
              />
              <span>© 2025 Noxyai.com</span>
            </div>
            <div></div>
          </div>
        </footer>
      </section>
    </div>
  )
}
