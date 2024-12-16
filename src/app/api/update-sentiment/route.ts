import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function POST(req: Request) {
  try {
    const { messageId, isLike, action } = await req.json()
    const db = await connectToDatabase()

    const sentiment = await db.collection('sentiments').findOne({ messageId })

    if (sentiment) {
      // Update existing sentiment
      await db.collection('sentiments').updateOne(
        { messageId },
        { 
          $inc: { 
            likes: isLike ? (action === 'add' ? 1 : -1) : 0, 
            dislikes: !isLike ? (action === 'add' ? 1 : -1) : 0 
          } 
        }
      )
    } else if (action === 'add') {
      // Create new sentiment only if action is 'add'
      await db.collection('sentiments').insertOne({
        messageId,
        likes: isLike ? 1 : 0,
        dislikes: !isLike ? 1 : 0
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating sentiment:', error)
    return NextResponse.json({ error: 'Failed to update sentiment' }, { status: 500 })
  }
}