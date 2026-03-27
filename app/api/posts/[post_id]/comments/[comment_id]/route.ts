import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// DELETE /api/posts/[post_id]/comments/[comment_id]/ — delete own comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ post_id: string; comment_id: string }> }
) {
  const { post_id, comment_id } = await params

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

  // Verify comment exists and belongs to this user
  const { data: comment, error: commentError } = await supabase
    .from("comments")
    .select("id, user_id, post_id")
    .eq("id", comment_id)
    .eq("post_id", post_id)
    .single()

  if (commentError || !comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 })
  }

  if (comment.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Delete the comment
  const { error: deleteError } = await supabase
    .from("comments")
    .delete()
    .eq("id", comment_id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Decrement comment_count on post, never below 0
  const { data: post } = await supabase
    .from("posts")
    .select("comment_count")
    .eq("id", post_id)
    .single()

  if (post) {
    await supabase
      .from("posts")
      .update({ comment_count: Math.max(0, post.comment_count - 1) })
      .eq("id", post_id)
  }

  return NextResponse.json({ message: "Comment deleted" }, { status: 200 })
}