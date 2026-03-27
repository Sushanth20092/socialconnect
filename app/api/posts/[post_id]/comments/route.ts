import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// GET /api/posts/[post_id]/comments/ — list comments for a post
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ post_id: string }> }
) {
  const { post_id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")))
  const offset = (page - 1) * limit

  // Verify post exists
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id")
    .eq("id", post_id)
    .eq("is_active", true)
    .single()

  if (postError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  const { data: comments, error, count } = await supabase
    .from("comments")
    .select(
      `id, content, created_at,
       author:profiles!comments_user_id_fkey(id, username, first_name, last_name, avatar_url)`,
      { count: "exact" }
    )
    .eq("post_id", post_id)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const total = count ?? 0

  return NextResponse.json({
    data: comments,
    meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
  })
}

// POST /api/posts/[post_id]/comments/ — add a comment
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ post_id: string }> }
) {
  const { post_id } = await params

  const authHeader = req.headers.get("authorization")
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.replace("Bearer ", "")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const content = body.content?.trim()

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 })
  }

  if (content.length > 280) {
    return NextResponse.json({ error: "Comment must be 280 characters or less" }, { status: 400 })
  }

  // Verify post exists
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, comment_count")
    .eq("id", post_id)
    .eq("is_active", true)
    .single()

  if (postError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  // Insert comment
  const { data: comment, error: commentError } = await supabase
    .from("comments")
    .insert({ content, user_id: user.id, post_id })
    .select(
      `id, content, created_at,
       author:profiles!comments_user_id_fkey(id, username, first_name, last_name, avatar_url)`
    )
    .single()

  if (commentError) {
    return NextResponse.json({ error: commentError.message }, { status: 500 })
  }

  // Increment comment_count on post
  await supabase
    .from("posts")
    .update({ comment_count: post.comment_count + 1 })
    .eq("id", post_id)

  return NextResponse.json({ data: comment }, { status: 201 })
}