"use client"

import type * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
// import { parse } from "csv-parse/sync" //removed as per update instruction
import { mean, median, mode, standardDeviation, linearRegression, sampleCorrelation, rSquared } from "simple-statistics"

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

const Analysis: React.FC = () => {
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([])
  const [messageData, setMessageData] = useState<MessageData[]>([])
  const [results, setResults] = useState<string | null>(null)
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
          //const records = parse(csvData, { //removed parse function
          //  columns: true,
          //  skip_empty_lines: true,
          //})
          //The following lines are a placeholder.  A CSV parsing library needs to be added to handle the parsing of the CSV data.  Papa Parse is a good option.
          const records: Array<SentimentData | MessageData> = [] // Initialize with proper type annotation
          if (file.name.includes("sentiments")) {
            setSentimentData(records.filter((r): r is SentimentData => "messageId" in r))
            setSentimentFileName(file.name)
          } else if (file.name.includes("messages")) {
            setMessageData(records.filter((r): r is MessageData => "conversationId" in r))
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

  const handleAnalysis = () => {
    if (sentimentData.length === 0 || messageData.length === 0) {
      setError("Please upload both CSV files before analyzing.")
      return
    }

    const likesArray = sentimentData.map((item) => Number(item.likes))
    const dislikesArray = sentimentData.map((item) => Number(item.dislikes))
    const userMessages = messageData.filter((item) => item.isUser === "true")
    const botMessages = messageData.filter((item) => item.isUser === "false")

    const calculateStats = (arr: number[]) => {
      if (arr.length === 0) return "No data"
      return `
        Average: ${mean(arr).toFixed(2)}
        Median: ${median(arr)}
        Mode: ${mode(arr)}
        Standard Deviation: ${standardDeviation(arr).toFixed(2)}
      `
    }

    const calculateRegression = (x: number[], y: number[]) => {
      const data = x.map((value, index) => [value, y[index]])
      const { m, b } = linearRegression(data)
      const rSquaredValue = rSquared(data, (x) => m * x + b)
      return `
        Slope: ${m.toFixed(4)}
        Intercept: ${b.toFixed(4)}
        R-squared: ${rSquaredValue.toFixed(4)}
      `
    }

    const calculateCorrelation = (x: number[], y: number[]) => {
      const correlation = sampleCorrelation(x, y)
      return `Correlation Coefficient: ${correlation.toFixed(4)}`
    }

    const results = `
      Sentiment Analysis:
      Likes:
      ${calculateStats(likesArray)}
      
      Dislikes:
      ${calculateStats(dislikesArray)}

      Message Analysis:
      Total messages: ${messageData.length}
      User messages: ${userMessages.length}
      Bot messages: ${botMessages.length}
      
      Average message length (characters):
      User: ${userMessages.length > 0 ? mean(userMessages.map((msg) => msg.text.length)).toFixed(2) : "No data"}
      Bot: ${botMessages.length > 0 ? mean(botMessages.map((msg) => msg.text.length)).toFixed(2) : "No data"}

      Linear Regression (Likes vs Dislikes):
      ${calculateRegression(likesArray, dislikesArray)}

      Correlation Analysis:
      ${calculateCorrelation(likesArray, dislikesArray)}
    `

    setResults(results)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center font-['Times_New_Roman']">
      <header className="w-full bg-blue-600 text-white py-6 text-center flex justify-between items-center px-4 mb-8">
        <Logo />
        <h1 className="text-2xl font-bold">Dm BoT Data Analysis</h1>
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
        <button
          onClick={handleAnalysis}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-300"
        >
          Analyze Data
        </button>
      </div>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {results && (
        <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-8 mt-8 border border-black">
          <h2 className="text-2xl font-bold mb-4 text-blue-600">Analysis Results</h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-800">{results}</pre>
        </div>
      )}
      <button
        onClick={() => router.push("/")}
        className="mt-8 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition duration-300"
      >
        Back to Home
      </button>
    </div>
  )
}

export default Analysis

