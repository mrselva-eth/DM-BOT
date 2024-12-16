import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/mongodb';

export async function POST(req: Request) {
  try {
    const { db } = await connectToDatabase();
    const articles = await req.json();

    if (!Array.isArray(articles)) {
      return NextResponse.json({ error: 'Invalid input. Expected an array of articles.' }, { status: 400 });
    }

    const result = await db.collection('articles').insertMany(articles);

    return NextResponse.json({ message: `${result.insertedCount} articles inserted successfully` }, { status: 201 });
  } catch (error) {
    console.error('Error inserting articles:', error);
    return NextResponse.json({ error: 'Failed to insert articles' }, { status: 500 });
  }
}