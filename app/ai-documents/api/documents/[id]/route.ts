import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@letterise/lib/auth'
import { sql } from '@letterise/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const documentId = parseInt(id)

    if (isNaN(documentId)) {
      return NextResponse.json(
        { error: 'Invalid document ID' },
        { status: 400 }
      )
    }

    const { content, fontPreference, textColor, fontSize, textBold, textItalic } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    await sql`
      UPDATE documents
      SET content = ${content}, 
          font_preference = ${fontPreference || 'times'},
          text_color = ${textColor || '#000000'},
          font_size = ${fontSize || 12},
          text_bold = ${textBold || false},
          text_italic = ${textItalic || false},
          updated_at = NOW()
      WHERE id = ${documentId} AND user_id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Document update error:', error)
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}
