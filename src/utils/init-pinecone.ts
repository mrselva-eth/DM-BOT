import { Pinecone } from "@pinecone-database/pinecone"

export async function initializePineconeIndexes() {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY is not set in environment variables")
  }

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  })

  // Check if indexes exist, create if they don't
  const indexList = await pinecone.listIndexes()
  const indexNames = indexList.indexes?.map((index) => index.name) || []

  if (!indexNames.includes("dm-bot")) {
    console.log("Creating dm-bot index...")
    await pinecone.createIndex({
      name: "dm-bot",
      dimension: 1536, // OpenAI embeddings dimension
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-west-2",
        },
      },
    })
  }

  if (!indexNames.includes("uploaded-documents")) {
    console.log("Creating uploaded-documents index...")
    await pinecone.createIndex({
      name: "uploaded-documents",
      dimension: 1536, // OpenAI embeddings dimension
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-west-2",
        },
      },
    })
  }

  return pinecone
}

