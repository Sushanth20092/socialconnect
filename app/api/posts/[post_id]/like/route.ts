import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// GET /api/posts/[post_id]/like/ — check if current user has liked this post
export async function GET(
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

  const { data: like } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", post_id)
    .single()

  return NextResponse.json({ liked: !!like })
}

// POST /api/posts/[post_id]/like/ — like a post
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

  // Check post exists
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, like_count")
    .eq("id", post_id)
    .eq("is_active", true)
    .single()

  if (postError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  // Check if already liked
  const { data: existingLike } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", user.id)
    .eq("post_id", post_id)
    .single()

  if (existingLike) {
    return NextResponse.json({ error: "Already liked" }, { status: 409 })
  }

  // Insert like
  const { error: likeError } = await supabase
    .from("likes")
    .insert({ user_id: user.id, post_id })

  if (likeError) {
    return NextResponse.json({ error: likeError.message }, { status: 500 })
  }

  // Increment like_count on post
  const { error: updateError } = await supabase
    .from("posts")
    .update({ like_count: post.like_count + 1 })
    .eq("id", post_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ message: "Liked" }, { status: 201 })
}

// DELETE /api/posts/[post_id]/like/ — unlike a post
export async function DELETE(
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

  // Check post exists
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, like_count")
    .eq("id", post_id)
    .eq("is_active", true)
    .single()

  if (postError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  // Delete like
  const { error: deleteError, count } = await supabase
    .from("likes")
    .delete({ count: "exact" })
    .eq("user_id", user.id)
    .eq("post_id", post_id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  if (count === 0) {
    return NextResponse.json({ error: "Like not found" }, { status: 404 })
  }

  // Decrement like_count, never below 0
  const { error: updateError } = await supabase
    .from("posts")
    .update({ like_count: Math.max(0, post.like_count - 1) })
    .eq("id", post_id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ message: "Unliked" }, { status: 200 })
}