import { NextRequest, NextResponse } from 'next/server';
import pinecone from '@/utils/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import { PineconeStore } from '@langchain/pinecone';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query') || 'SafePath project';

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    const index = pinecone.index('dm-bot');
    
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex: index });

    const results = await vectorStore.similaritySearch(query, 10);

    // Get all unique IDs from the results
    const ids = [...new Set(results.map(r => r.metadata.articleId))];

    // Fetch full articles from MongoDB
    const client = await clientPromise;
    const db = client.db("dmbot");
    const collection = db.collection('articles');
    const fullArticles = await collection.find({ _id: { $in: ids.map(id => new ObjectId(id)) } }).toArray();

    return NextResponse.json({ 
      results,
      fullArticles,
      totalResults: results.length,
      totalUniqueArticles: fullArticles.length
    });
  } catch (error) {
    console.error('Error checking Pinecone:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}