import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("dmbot");
    const collection = db.collection('articles');

    // Find duplicate documents
    const duplicates = await collection.aggregate([
      {
        $group: {
          _id: { content: "$content" },
          dups: { $addToSet: "$_id" },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]).toArray();

    let deletedCount = 0;

    // Remove duplicate documents (keeping one)
    for (let duplicate of duplicates) {
      const [keep, ...remove] = duplicate.dups;
      const result = await collection.deleteMany({ _id: { $in: remove } });
      deletedCount += result.deletedCount;
    }

    // Update Pinecone index
    // You may want to call your updatePineconeIndex function here

    return NextResponse.json({ 
      message: `Removed ${deletedCount} duplicate articles`,
      duplicatesFound: duplicates.length
    });
  } catch (error) {
    console.error('Error removing duplicates:', error);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}