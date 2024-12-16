import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/utils/mongodb';
import { ObjectId } from 'mongodb';
import { updatePineconeArticle } from '@/utils/updatePineconeArticle';

export async function POST(req: NextRequest) {
  try {
    const { title, content } = await req.json();

    const client = await clientPromise;
    const db = client.db("dmbot");
    const collection = db.collection('articles');

    const result = await collection.insertOne({ title, content, createdAt: new Date() });

    // Update Pinecone index
    await updatePineconeArticle(result.insertedId.toString());

    return NextResponse.json({ message: 'Article added successfully', articleId: result.insertedId });
  } catch (error: unknown) {
    console.error('Error adding article:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'An error occurred while adding the article', details: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, title, content } = await req.json();

    const client = await clientPromise;
    const db = client.db("dmbot");
    const collection = db.collection('articles');

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { title, content, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Update Pinecone index
    await updatePineconeArticle(id);

    return NextResponse.json({ message: 'Article updated successfully' });
  } catch (error: unknown) {
    console.error('Error updating article:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'An error occurred while updating the article', details: errorMessage }, { status: 500 });
  }
}