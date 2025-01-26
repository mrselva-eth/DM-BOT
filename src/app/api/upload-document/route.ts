import { type NextRequest, NextResponse } from "next/server"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { OpenAIEmbeddings } from "@langchain/openai"
import { PineconeStore } from "@langchain/pinecone"
import { getPineconeClient } from "@/utils/pinecone"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const fileContent = await file.text()

    // Split the document into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    })
    const docs = await textSplitter.createDocuments([fileContent])

    // Initialize embeddings
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    })

    // Get Pinecone client and initialize index
    const pinecone = await getPineconeClient()
    if (!pinecone) {
      throw new Error("Failed to initialize Pinecone client")
    }

    // Initialize Pinecone index
    const index = pinecone.index("uploaded-documents")

    // Create and store the embeddings
    const vectorStore = await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
    })

    return NextResponse.json({ message: "Document uploaded and processed successfully" })
  } catch (error) {
    console.error("Error uploading document:", error)
    return NextResponse.json({ error: "An error occurred while uploading the document" }, { status: 500 })
  }
}

