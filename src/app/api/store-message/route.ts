import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const message = await req.json();

    const client = await clientPromise;
    const db = client.db("dmbot");
    const collection = db.collection('messages');

    const result = await collection.insertOne({
      ...message,
      timestamp: new Date(message.timestamp)
    });

    return NextResponse.json({ message: 'Message stored successfully', messageId: result.insertedId });
  } catch (error) {
    console.error('Error storing message:', error);
    return NextResponse.json({ error: 'An error occurred while storing the message' }, { status: 500 });
  }
}