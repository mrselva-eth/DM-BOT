import { type NextRequest, NextResponse } from "next/server"
import { OpenAIEmbeddings } from "@langchain/openai"
import { PineconeStore } from "@langchain/pinecone"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getPineconeClient } from "@/utils/pinecone"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get("query") || "SafePath project"

    // Initialize embeddings with higher threshold
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    })

    const pinecone = await getPineconeClient()
    const index = pinecone.Index("dm-bot")

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      filter: { score: { $gt: 0.7 } }, // Increased similarity threshold
    })

    const results = await vectorStore.similaritySearch(query, 10)

    // Get all unique IDs from the results
    const ids = [...new Set(results.map((r) => r.metadata.articleId))]

    // Fetch full articles from MongoDB
    const client = await clientPromise
    const db = client.db("dmbot")
    const collection = db.collection("articles")
    const fullArticles = await collection.find({ _id: { $in: ids.map((id) => new ObjectId(id)) } }).toArray()

    // Additional filtering for more relevant results
    const filteredArticles = fullArticles.filter((article) => {
      const titleMatch = article.title.toLowerCase().includes(query.toLowerCase())
      const contentMatch = article.content.toLowerCase().includes(query.toLowerCase())
      return titleMatch || contentMatch
    })

    return NextResponse.json({
      results,
      fullArticles: filteredArticles,
      totalResults: results.length,
      totalUniqueArticles: filteredArticles.length,
    })
  } catch (error) {
    console.error("Error checking Pinecone:", error)
    return NextResponse.json({ error: "An error occurred" }, { status: 500 })
  }
}

