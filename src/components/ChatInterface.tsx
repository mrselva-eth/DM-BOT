"use client"

import type * as React from "react"
import { useState, useEffect, useRef } from "react"
import {
  FaEdit,
  FaTrash,
  FaCopy,
  FaCheck,
  FaThumbsUp,
  FaThumbsDown,
  FaRedo,
  FaArrowDown,
  FaSearch,
  FaArrowUp,
} from "react-icons/fa"

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: string
  isEdited?: boolean
  likes?: number
  dislikes?: number
}

const TypingAnimation: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
    </div>
  )
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  text: "🤖 Hi! I am your Disaster Management(DM BoT) Assistant. How can I help you today?",
  isUser: false,
  timestamp: new Date().toLocaleTimeString(),
  likes: 0,
  dislikes: 0,
}

const makeLinkClickable = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)(?=[.!?,;:]?(\s|$))/g
  return text.replace(urlRegex, (url) => {
    const cleanUrl = url.replace(/[.!?,;:]$/, "")
    return `<a href="${cleanUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline break-words">${cleanUrl}</a>${url.slice(cleanUrl.length)}`
  })
}

export default function Component() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editInput, setEditInput] = useState("")
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set())
  const [dislikedMessages, setDislikedMessages] = useState<Set<string>>(new Set())
  const [showScrollButton, setShowScrollButton] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [interfaceMode, setInterfaceMode] = useState<"chat" | "weather">("chat")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearchInput, setShowSearchInput] = useState(false)
  const [weatherCity, setWeatherCity] = useState("")
  const [weatherData, setWeatherData] = useState<any>(null)
  const [searchResults, setSearchResults] = useState<number[]>([])
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    setMessages([WELCOME_MESSAGE])

    const handleBeforeUnload = () => {
      sessionStorage.removeItem("chatMessages")
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("chatMessages", JSON.stringify(messages))
    }
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
        const atBottom = scrollHeight - scrollTop - clientHeight < 1
        setShowScrollButton(!atBottom)
      }
    }

    const chatContainer = chatContainerRef.current
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll)
    }

    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener("scroll", handleScroll)
      }
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest(".search-container") && !target.closest(".search-button")) {
        setShowSearchInput(false)
        setSearchQuery("")
        setSearchResults([])
        setCurrentSearchIndex(-1)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [])

  const storeMessage = async (message: Message) => {
    try {
      const response = await fetch("/api/store-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      })

      if (!response.ok) {
        throw new Error("Failed to store message")
      }

      const result = await response.json()
      console.log("Message stored:", result)
    } catch (error) {
      console.error("Error storing message:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent, editedMessageId?: string) => {
    e.preventDefault()
    const messageText = editedMessageId ? editInput : input
    if (messageText.trim()) {
      const newMessage: Message = {
        id: editedMessageId || Date.now().toString(),
        text: messageText,
        isUser: true,
        timestamp: new Date().toLocaleTimeString(),
        isEdited: !!editedMessageId,
      }

      if (editedMessageId) {
        setMessages((prev) => {
          const editedIndex = prev.findIndex((m) => m.id === editedMessageId)
          if (editedIndex !== -1) {
            return [...prev.slice(0, editedIndex), newMessage]
          }
          return prev
        })
        setEditingMessageId(null)
        setEditInput("")
      } else {
        setMessages((prev) => [...prev, newMessage])
        setInput("")
      }

      setIsLoading(true)
      scrollToBottom()

      await storeMessage(newMessage)

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: messageText }),
        })

        if (!response.ok) {
          throw new Error("Failed to get response from the server")
        }

        const data = await response.json()
        const botMessage: Message = {
          id: Date.now().toString(),
          text: data.content,
          isUser: false,
          timestamp: new Date().toLocaleTimeString(),
          likes: 0,
          dislikes: 0,
        }
        setMessages((prev) => [...prev, botMessage])
        await storeMessage(botMessage)
      } catch (error) {
        console.error("Error:", error)
        const errorMessage: Message = {
          id: Date.now().toString(),
          text: "Sorry, I encountered an error. Please try again.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString(),
          likes: 0,
          dislikes: 0,
        }
        setMessages((prev) => [...prev, errorMessage])
        await storeMessage(errorMessage)
      } finally {
        setIsLoading(false)
        scrollToBottom()
      }
    }
  }

  const handleEdit = (id: string) => {
    const messageToEdit = messages.find((m) => m.id === id)
    if (messageToEdit) {
      setEditingMessageId(id)
      setEditInput(messageToEdit.text)
    }
  }

  const handleDelete = (id: string) => {
    setMessages((prev) => {
      const index = prev.findIndex((m) => m.id === id)
      if (index !== -1) {
        return prev.slice(0, index)
      }
      return prev
    })
  }

  const handleCopy = (id: string) => {
    const messageToCopy = messages.find((m) => m.id === id)
    if (messageToCopy) {
      navigator.clipboard
        .writeText(messageToCopy.text)
        .then(() => {
          setCopiedMessageId(id)
          setTimeout(() => setCopiedMessageId(null), 2000)
        })
        .catch((err) => console.error("Failed to copy text: ", err))
    }
  }

  const handleRetry = async (id: string) => {
    const messageToRetry = messages.find((m) => m.id === id)
    if (messageToRetry && !messageToRetry.isUser) {
      const userMessage = messages[messages.indexOf(messageToRetry) - 1]
      if (userMessage && userMessage.isUser) {
        setIsLoading(true)
        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message: userMessage.text }),
          })

          if (!response.ok) {
            throw new Error("Failed to get response from the server")
          }

          const data = await response.json()
          const newBotMessage: Message = {
            id: Date.now().toString(),
            text: data.content,
            isUser: false,
            timestamp: new Date().toLocaleTimeString(),
            likes: 0,
            dislikes: 0,
          }
          setMessages((prev) => [...prev.slice(0, prev.indexOf(messageToRetry)), newBotMessage])
          await storeMessage(newBotMessage)
        } catch (error) {
          console.error("Error:", error)
        } finally {
          setIsLoading(false)
          scrollToBottom()
        }
      }
    }
  }

  const handleLikeDislike = async (id: string, isLike: boolean) => {
    const messageToUpdate = messages.find((m) => m.id === id)
    if (messageToUpdate && !messageToUpdate.isUser) {
      if ((isLike && likedMessages.has(id)) || (!isLike && dislikedMessages.has(id))) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  likes: isLike ? (m.likes || 1) - 1 : m.likes,
                  dislikes: !isLike ? (m.dislikes || 1) - 1 : m.dislikes,
                }
              : m,
          ),
        )
        if (isLike) {
          setLikedMessages((prev) => {
            const newSet = new Set(prev)
            newSet.delete(id)
            return newSet
          })
        } else {
          setDislikedMessages((prev) => {
            const newSet = new Set(prev)
            newSet.delete(id)
            return newSet
          })
        }
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  likes: isLike ? (m.likes || 0) + 1 : likedMessages.has(id) ? (m.likes || 1) - 1 : m.likes,
                  dislikes: !isLike
                    ? (m.dislikes || 0) + 1
                    : dislikedMessages.has(id)
                      ? (m.dislikes || 1) - 1
                      : m.dislikes,
                }
              : m,
          ),
        )
        if (isLike) {
          setLikedMessages((prev) => new Set(prev).add(id))
          setDislikedMessages((prev) => {
            const newSet = new Set(prev)
            newSet.delete(id)
            return newSet
          })
        } else {
          setDislikedMessages((prev) => new Set(prev).add(id))
          setLikedMessages((prev) => {
            const newSet = new Set(prev)
            newSet.delete(id)
            return newSet
          })
        }
      }

      try {
        const response = await fetch("/api/update-sentiment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messageId: id,
            isLike,
            action: (isLike && likedMessages.has(id)) || (!isLike && dislikedMessages.has(id)) ? "remove" : "add",
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to update sentiment")
        }
      } catch (error) {
        console.error("Error updating sentiment:", error)
      }
    }
  }

  const handleSearch = () => {
    const results = messages.reduce((acc, message, index) => {
      if (message.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        acc.push(index)
      }
      return acc
    }, [] as number[])
    setSearchResults(results)
    setCurrentSearchIndex(results.length > 0 ? 0 : -1)
    if (results.length > 0) {
      scrollToMessage(results[0])
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleWeatherSearch = async () => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${weatherCity}&appid=089824911a7c2ae5ffe699f59a2c1e53&units=metric`,
      )
      if (!response.ok) {
        throw new Error("Failed to fetch weather data")
      }
      const data = await response.json()
      setWeatherData(data)
    } catch (error) {
      console.error("Error fetching weather data:", error)
      setWeatherData(null)
    }
  }

  const handleWeatherKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleWeatherSearch()
    }
  }

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, "gi"))
    return parts
      .map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? `<span class="bg-green-300">${part}</span>` : part,
      )
      .join("")
  }

  const scrollToMessage = (index: number) => {
    const messageElements = chatContainerRef.current?.getElementsByClassName("message")
    if (messageElements && messageElements[index]) {
      messageElements[index].scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  const handlePrevSearch = () => {
    if (currentSearchIndex > 0) {
      setCurrentSearchIndex((prev) => prev - 1)
      scrollToMessage(searchResults[currentSearchIndex - 1])
    }
  }

  const handleNextSearch = () => {
    if (currentSearchIndex < searchResults.length - 1) {
      setCurrentSearchIndex((prev) => prev + 1)
      scrollToMessage(searchResults[currentSearchIndex + 1])
    }
  }

  return (
    <div className="flex flex-col h-full font-['Times_New_Roman']">
      <div className="bg-blue-500 text-white p-2 flex justify-between items-center">
        <select
          value={interfaceMode}
          onChange={(e) => setInterfaceMode(e.target.value as "chat" | "weather")}
          className="bg-blue-600 text-white p-1 rounded text-sm"
        >
          <option value="chat">DM BoT</option>
          <option value="weather">Weather Data</option>
        </select>
        {interfaceMode === "chat" && (
          <div className="flex items-center search-container">
            {showSearchInput && (
              <>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search messages..."
                  className="mr-2 p-1 text-sm border border-black rounded bg-white text-black w-40"
                />
                <div className="flex">
                  <button onClick={handlePrevSearch} className="bg-blue-600 p-1 rounded-l">
                    <FaArrowUp />
                  </button>
                  <button onClick={handleNextSearch} className="bg-blue-600 p-1 rounded-r border-l border-blue-500">
                    <FaArrowDown />
                  </button>
                </div>
              </>
            )}
            <button
              onClick={() => setShowSearchInput(!showSearchInput)}
              className="bg-blue-600 p-1 rounded ml-2 search-button"
            >
              <FaSearch />
            </button>
          </div>
        )}
      </div>
      {interfaceMode === "chat" ? (
        <>
          <div className="flex-grow overflow-y-auto p-4 space-y-4" ref={chatContainerRef}>
            {messages.map((message, index) => (
              <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"} message`}>
                <div
                  className={`max-w-[70%] p-2 rounded-lg ${
                    message.isUser
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-100 text-gray-800 border border-gray-300 hover:bg-blue-100"
                  } transition-colors duration-200 ${index === searchResults[currentSearchIndex] ? "ring-2 ring-yellow-400" : ""}`}
                >
                  {editingMessageId === message.id ? (
                    <form onSubmit={(e) => handleSubmit(e, message.id)} className="flex items-center">
                      <input
                        type="text"
                        value={editInput}
                        onChange={(e) => setEditInput(e.target.value)}
                        className="flex-grow p-1 border border-black rounded text-black bg-white"
                        autoFocus
                      />
                      <button type="submit" className="ml-2 text-white">
                        <FaCheck size={12} />
                      </button>
                    </form>
                  ) : (
                    <div className="mb-1 break-words">
                      {message.isUser ? (
                        <>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: makeLinkClickable(highlightText(message.text, searchQuery)),
                            }}
                          />
                          {message.isEdited && <span className="text-xs ml-1">(edited)</span>}
                        </>
                      ) : (
                        <div
                          className="message-content"
                          dangerouslySetInnerHTML={{
                            __html: highlightText(message.text, searchQuery),
                          }}
                        />
                      )}
                    </div>
                  )}
                  <div className="text-xs text-right mt-1 opacity-70">{message.timestamp}</div>
                  <div className="flex justify-end mt-1 space-x-2">
                    <button
                      onClick={() => handleCopy(message.id)}
                      className={`text-xs ${message.isUser ? "hover:text-white" : "hover:text-blue-500"}`}
                      title="Copy message"
                    >
                      {copiedMessageId === message.id ? <FaCheck size={12} /> : <FaCopy size={12} />}
                    </button>
                    {message.isUser && (
                      <>
                        <button
                          onClick={() => handleEdit(message.id)}
                          className="text-xs hover:text-white"
                          title="Edit message"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(message.id)}
                          className="text-xs hover:text-white"
                          title="Delete message"
                        >
                          <FaTrash size={12} />
                        </button>
                      </>
                    )}
                    {!message.isUser && (
                      <>
                        <button
                          onClick={() => handleRetry(message.id)}
                          className="text-xs hover:text-blue-500"
                          title="Retry"
                        >
                          <FaRedo size={12} />
                        </button>
                        <button
                          onClick={() => handleLikeDislike(message.id, true)}
                          className={`text-xs hover:text-blue-500 ${likedMessages.has(message.id) ? "text-green-500" : ""}`}
                          title="Like"
                        >
                          <FaThumbsUp size={12} />
                        </button>
                        <button
                          onClick={() => handleLikeDislike(message.id, false)}
                          className={`text-xs hover:text-blue-500 ${dislikedMessages.has(message.id) ? "text-red-500" : ""}`}
                          title="Dislike"
                        >
                          <FaThumbsDown size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-2 rounded-lg text-gray-800 border border-gray-300">
                  <TypingAnimation />
                  <div className="text-xs text-right mt-1 opacity-70">{new Date().toLocaleTimeString()}</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-600 transition-colors duration-200"
            >
              <FaArrowDown size={16} />
            </button>
          )}
          <form onSubmit={handleSubmit} className="border-t p-4 bg-gray-50">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-grow p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400 font-['Times_New_Roman']"
                placeholder="Type your message..."
                disabled={isLoading}
              />
              <button
                type="submit"
                className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition-colors duration-200 disabled:bg-blue-300"
                disabled={isLoading}
              >
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
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </form>
        </>
      ) : (
        <div className="flex-grow p-4 bg-white">
          <div className="mb-4">
            <input
              type="text"
              value={weatherCity}
              onChange={(e) => setWeatherCity(e.target.value)}
              onKeyDown={handleWeatherKeyDown}
              placeholder="Enter city name"
              className="p-2 border border-black rounded mr-2 text-black"
            />
            <button onClick={handleWeatherSearch} className="bg-blue-500 text-white p-2 rounded">
              Search Weather
            </button>
          </div>
          {weatherData && (
            <div className="bg-white p-4 rounded shadow border border-black text-black mb-4">
              <h2 className="text-xl font-bold mb-2">{weatherData.name}</h2>
              <p>Temperature: {weatherData.main.temp}°C</p>
              <p>Weather: {weatherData.weather[0].description}</p>
              <p>Humidity: {weatherData.main.humidity}%</p>
            </div>
          )}
          <div className="bg-white p-4 rounded shadow border border-black text-black">
            <h3 className="text-lg font-bold mb-2">Emergency Contacts</h3>
            <ul>
              <li>John Doe: 123-456-7890</li>
              <li>Jane Smith: 234-567-8901</li>
              <li>Mike Johnson: 345-678-9012</li>
              <li>Sarah Brown: 456-789-0123</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

