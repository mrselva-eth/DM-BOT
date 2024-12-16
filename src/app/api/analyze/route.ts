import { NextRequest, NextResponse } from 'next/server'
import { writeFile, readFile } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file1 = formData.get('file1') as File
  const file2 = formData.get('file2') as File

  if (!file1 || !file2) {
    return NextResponse.json({ error: 'Both files are required' }, { status: 400 })
  }

  const bytes1 = await file1.arrayBuffer()
  const bytes2 = await file2.arrayBuffer()
  const buffer1 = Buffer.from(bytes1)
  const buffer2 = Buffer.from(bytes2)

  const filePath1 = path.join(process.cwd(), 'public', 'uploads', file1.name)
  const filePath2 = path.join(process.cwd(), 'public', 'uploads', file2.name)

  await writeFile(filePath1, buffer1)
  await writeFile(filePath2, buffer2)

  const data1 = await readFile(filePath1, 'base64')
  const data2 = await readFile(filePath2, 'base64')

  return NextResponse.json({ data1, data2 })
}