import { MongoClient, ObjectId } from 'mongodb';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { PineconeStore } from '@langchain/pinecone';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export async function updatePineconeArticle(articleId: string) {
  // Connect to MongoDB
  const client = await MongoClient.connect(process.env.MONGODB_URI as string);
  const db = client.db("dmbot");
  const collection = db.collection('articles');

  // Fetch the article from MongoDB
  const article = await collection.findOne({ _id: new ObjectId(articleId) });

  if (!article) {
    console.error(`Article with ID ${articleId} not found`);
    await client.close();
    return;
  }

  // Initialize Pinecone
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY as string,
  });
  const index = pinecone.index('dm-bot');

  // Initialize OpenAI embeddings
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Initialize vector store
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index });

  // Delete existing vectors for this article
  await vectorStore.delete({ filter: { articleId: articleId } });

  // Process the article
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const docs = await textSplitter.createDocuments([article.content]);
  
  // Add documents to Pinecone
  await vectorStore.addDocuments(docs.map(doc => new Document({
    pageContent: doc.pageContent,
    metadata: { 
      articleId: article._id.toString(),
      title: article.title
    }
  })));

  console.log(`Updated article in Pinecone: ${article.title}`);
  await client.close();
}