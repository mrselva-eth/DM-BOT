import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("dmbot");
    const collection = db.collection('articles');
    const count = await collection.countDocuments();
    return NextResponse.json({ message: 'MongoDB connection successful', articleCount: count });
  } catch (error: unknown) {
    console.error('Error connecting to MongoDB:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to connect to MongoDB', details: errorMessage }, { status: 500 });
  }
}