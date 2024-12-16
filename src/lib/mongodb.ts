import { MongoClient, Db } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

const uri = process.env.MONGODB_URI
const options = {}

let client
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

clientPromise.then(() => {
  console.log('Connected successfully to MongoDB')
}).catch((error) => {
  console.error('Failed to connect to MongoDB:', error)
})

export async function connectToDatabase(): Promise<Db> {
  const client = await clientPromise
  return client.db()
}

export default clientPromise