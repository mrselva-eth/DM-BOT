"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import ChatInterface from "@/components/ChatInterface"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

const MessageCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40" fill="#2563EB" {...props}>
    <circle cx="20" cy="20" r="20" />
    <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">
      Dm
    </text>
  </svg>
)

const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

const ArrowRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
)

const DateTimeDisplay: React.FC = () => {
  const [dateTime, setDateTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
    return date.toLocaleDateString("en-US", options)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <div className="bg-blue-500 text-white p-2 rounded-md font-['Times_New_Roman']">
      <div>{formatDate(dateTime)}</div>
      <div>{formatTime(dateTime)}</div>
    </div>
  )
}

const PDFViewer: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto mt-12 mb-20">
      <h2 className="text-3xl font-bold text-blue-600 mb-8 text-center font-['Times_New_Roman']">
        Dm BoT&apos;s Features PDF
      </h2>
      <div className="border-2 border-black rounded-lg overflow-hidden" style={{ height: "600px" }}>
        <iframe
          src="/dmbot.pdf"
          width="100%"
          height="100%"
          style={{ border: "none" }}
          title="Disaster Management Guide PDF"
        />
      </div>
    </div>
  )
}

const Logo: React.FC = () => (
  <div className="flex flex-col items-center justify-center">
    <div className="flex items-center">
      <div className="bg-white rounded-full p-2 mr-2 border-2 border-black">
        <span className="text-blue-600 font-bold text-2xl font-['Times_New_Roman']">Dm</span>
      </div>
      <span className="text-black font-bold text-2xl font-['Times_New_Roman']">BoT</span>
    </div>
  </div>
)

const DropdownMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleOptionClick = (path: string) => {
    setIsOpen(false)
    router.push(path)
  }

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="bg-blue-600 text-white px-4 py-2 rounded-md">
        Menu
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
          <Link href="/visualization">
            <div className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-500 hover:text-white cursor-pointer">
              Dm BoT Data Visualization
            </div>
          </Link>
          <Link href="/analysis">
            <div className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-500 hover:text-white cursor-pointer">
              Analysis
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setIsChatOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [chatRef])

  const toggleChat = () => {
    setIsChatOpen((prev) => !prev)
  }

  return (
    <main className="min-h-screen bg-white flex flex-col items-center relative font-['Times_New_Roman']">
      <header className="w-full bg-blue-600 text-white py-6 text-center flex justify-between items-center px-4">
        <Logo />
        <h2 className="text-2xl">Disaster Management Bot</h2>
        <DropdownMenu />
      </header>

      <PDFViewer />

      {isClient && (
        <div className="fixed bottom-4 right-4 flex items-center">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mr-4"
          >
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
              className="flex items-center"
            >
              <span className="mr-2 font-semibold text-blue-600">Ask Dm BoT</span>
              <ArrowRightIcon className="text-blue-600" />
            </motion.div>
          </motion.div>
          <div className="relative">
            <button
              onClick={toggleChat}
              className="bg-blue-600 text-white rounded-full p-2 shadow-lg hover:bg-blue-700 transition-colors duration-200"
              aria-label={isChatOpen ? "Close chat" : "Open chat"}
            >
              {isChatOpen ? <XIcon /> : <MessageCircleIcon />}
            </button>
          </div>

          {isChatOpen && (
            <div
              ref={chatRef}
              className="absolute bottom-16 right-0 w-96 bg-white rounded-lg shadow-xl flex flex-col z-50 border-2 border-gray-200 overflow-hidden"
              style={{ height: "calc(100vh - 6rem)", maxHeight: "600px" }}
            >
              <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                <Logo />
                <DateTimeDisplay />
              </div>
              <div className="flex-grow overflow-hidden">
                <ChatInterface />
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

