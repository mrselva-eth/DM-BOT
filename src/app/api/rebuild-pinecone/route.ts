import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import pinecone from '@/utils/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { PineconeStore } from '@langchain/pinecone';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

async function rebuildPineconeIndex() {
  try {
    console.log('Starting Pinecone index rebuild...');

    const client = await clientPromise;
    console.log('MongoDB client connected');

    const db = client.db("dmbot");
    const collection = db.collection('articles');

    const articles = await collection.find({}).toArray();
    console.log(`Found ${articles.length} articles in MongoDB`);

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    console.log('OpenAI embeddings initialized');

    const index = pinecone.index('dm-bot');
    console.log('Pinecone index initialized');

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index });
    console.log('Vector store created from existing Pinecone index');

    // Clear existing vectors
    await vectorStore.delete({ deleteAll: true });
    console.log('Existing vectors deleted from Pinecone');

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    for (const article of articles) {
      const docs = await textSplitter.createDocuments([article.content]);
      
      await vectorStore.addDocuments(docs.map(doc => new Document({
        pageContent: doc.pageContent,
        metadata: { 
          articleId: article._id.toString(),
          title: article.title
        }
      })));
      console.log(`Added article "${article.title}" to Pinecone`);
    }

    console.log('Pinecone index rebuild completed successfully');
    return { message: 'Pinecone index rebuilt successfully' };
  } catch (error) {
    console.error('Error in rebuildPineconeIndex:', error);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log('GET request received for rebuild-pinecone');
    const result = await rebuildPineconeIndex();
    console.log('Rebuild completed, sending response');
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error in GET handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'An error occurred', details: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('POST request received for rebuild-pinecone');
    const result = await rebuildPineconeIndex();
    console.log('Rebuild completed, sending response');
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error in POST handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'An error occurred', details: errorMessage }, { status: 500 });
  }
}