import { NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/admin-auth"
import { put } from '@vercel/blob';

export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`
    
    const blob = await put(filename, file, {
      access: 'public',
    });

    return NextResponse.json({ success: true, url: blob.url })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ success: false, error: "File upload failed" }, { status: 500 })
  }
}