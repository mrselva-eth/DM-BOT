"use client"

import type * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { parse } from "csv-parse/sync"
import { Bar, Pie, Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement)

interface SentimentData {
  _id: string
  messageId: string
  likes: number
  dislikes: number
}

interface MessageData {
  _id: string
  id: string
  text: string
  isUser: string
  timestamp: string
  isEdited: string
  conversationId: string
  likes: number
  dislikes: number
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

const DataVisualization: React.FC = () => {
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([])
  const [messageData, setMessageData] = useState<MessageData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sentimentFileName, setSentimentFileName] = useState<string | null>(null)
  const [messageFileName, setMessageFileName] = useState<string | null>(null)
  const router = useRouter()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const csvData = e.target?.result as string
          const records = parse(csvData, {
            columns: true,
            skip_empty_lines: true,
          })

          if (file.name.includes("sentiments")) {
            setSentimentData(records as SentimentData[])
            setSentimentFileName(file.name)
          } else if (file.name.includes("messages")) {
            setMessageData(records as MessageData[])
            setMessageFileName(file.name)
          }

          setError(null)
        } catch (err) {
          setError("Error processing file. Please make sure it's a valid CSV.")
        }
      }
      reader.readAsText(file)
    }
  }

  const sentimentChartData = {
    labels: ["Likes", "Dislikes"],
    datasets: [
      {
        data: [
          sentimentData.reduce((sum, item) => sum + Number(item.likes), 0),
          sentimentData.reduce((sum, item) => sum + Number(item.dislikes), 0),
        ],
        backgroundColor: ["rgba(54, 162, 235, 0.6)", "rgba(255, 99, 132, 0.6)"],
      },
    ],
  }

  const messageChartData = {
    labels: ["User Messages", "Bot Messages"],
    datasets: [
      {
        label: "Number of Messages",
        data: [
          messageData.filter((item) => item.isUser === "true").length,
          messageData.filter((item) => item.isUser === "false").length,
        ],
        backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 159, 64, 0.6)"],
      },
    ],
  }

  const messageLengthChartData = {
    labels: messageData.map((_, index) => index + 1),
    datasets: [
      {
        label: "Message Length",
        data: messageData.filter((item) => item.isUser === "true").map((item) => item.text.length),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
      },
    ],
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center font-['Times_New_Roman']">
      <header className="w-full bg-blue-600 text-white py-6 text-center flex justify-between items-center px-4 mb-8">
        <Logo />
        <h1 className="text-2xl font-bold">Dm BoT Data Visualization</h1>
        <div className="w-[100px]"></div>
      </header>
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-8">
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Sentiment Data</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {sentimentFileName && <p className="mt-2 text-sm text-gray-600">Uploaded: {sentimentFileName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Message Data</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {messageFileName && <p className="mt-2 text-sm text-gray-600">Uploaded: {messageFileName}</p>}
          </div>
        </div>
      </div>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      <div className="w-full max-w-4xl mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {sentimentData.length > 0 && (
          <div className="bg-white shadow-lg rounded-lg p-6 border border-black">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Sentiment Analysis</h2>
            <Pie data={sentimentChartData} />
          </div>
        )}
        {messageData.length > 0 && (
          <div className="bg-white shadow-lg rounded-lg p-6 border border-black">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Message Distribution</h2>
            <Bar data={messageChartData} />
          </div>
        )}
        {messageData.length > 0 && (
          <div className="bg-white shadow-lg rounded-lg p-6 border border-black col-span-2">
            <h2 className="text-xl font-bold mb-4 text-blue-600">Message Length Over Time</h2>
            <Line data={messageLengthChartData} />
          </div>
        )}
      </div>
      <button
        onClick={() => router.push("/")}
        className="mt-8 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition duration-300"
      >
        Back to Home
      </button>
    </div>
  )
}

export default DataVisualization

