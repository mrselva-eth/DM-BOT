import { NextResponse } from "next/server"
import { connectToDatabase } from "@/utils/mongodb"

export async function POST(req: Request) {
  try {
    const { db } = await connectToDatabase()
    const articles = await req.json()

    if (!Array.isArray(articles)) {
      return NextResponse.json({ error: "Invalid input. Expected an array of articles." }, { status: 400 })
    }

    // Validate articles before insertion
    const validArticles = articles.filter((article) => {
      const content = article.content.toLowerCase()
      return content.includes("disaster") || content.includes("emergency") || content.includes("management")
    })

    if (validArticles.length === 0) {
      return NextResponse.json(
        {
          error: "No valid disaster management related articles found",
        },
        { status: 400 },
      )
    }

    const result = await db.collection("articles").insertMany(validArticles)

    return NextResponse.json({ message: `${result.insertedCount} articles inserted successfully` }, { status: 201 })
  } catch (error) {
    console.error("Error inserting articles:", error)
    return NextResponse.json({ error: "Failed to insert articles" }, { status: 500 })
  }
}

