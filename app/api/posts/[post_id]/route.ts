import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: { post_id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { post_id } = params

  const { data: post, error } = await supabase
    .from("posts")
    .select(`
      id,
      content,
      image_url,
      like_count,
      comment_count,
      is_active,
      created_at,
      updated_at,
      author:profiles(
        id,
        username,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq("id", post_id)
    .eq("is_active", true)
    .single()

  if (error || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  return NextResponse.json({ data: post }, { status: 200 })
}