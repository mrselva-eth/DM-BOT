import type { Pinecone } from "@pinecone-database/pinecone"
import { initializePineconeIndexes } from "./init-pinecone"

if (!process.env.PINECONE_API_KEY) {
  throw new Error("PINECONE_API_KEY is not set in the environment variables")
}

let pineconeInstance: Pinecone | null = null

export async function getPineconeClient(): Promise<Pinecone> {
  if (!pineconeInstance) {
    pineconeInstance = await initializePineconeIndexes()
  }
  return pineconeInstance
}

export default getPineconeClient

