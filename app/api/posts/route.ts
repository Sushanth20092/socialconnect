import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabaseClient"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    let { content, image_url } = body

    // Trim content
    content = content?.trim()

    // Validation
    if (!content || content.length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      )
    }

    if (content.length > 280) {
      return NextResponse.json(
        { error: "Content must be under 280 characters" },
        { status: 400 }
      )
    }

    // Get logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Insert post
    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          content,
          image_url: image_url || null,
          author_id: user.id,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ post: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    )
  }
}