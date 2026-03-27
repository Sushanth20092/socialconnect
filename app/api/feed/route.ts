import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// GET /api/feed/ — personalised chronological feed of posts from followed users
// Falls back to all public posts if user follows nobody
export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "10")))
  const offset = (page - 1) * limit

  // Get list of users the current user follows
  const { data: followingData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id)

  const followingIds = followingData?.map((f) => f.following_id) ?? []

  // If following nobody, fall back to all public posts
  const query = supabase
    .from("posts")
    .select(
      `id, content, image_url, like_count, comment_count, created_at, updated_at,
       author:profiles!posts_author_id_profiles_fkey(id, username, first_name, last_name, avatar_url)`,
      { count: "exact" }
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (followingIds.length > 0) {
    query.in("author_id", followingIds)
  }

  const { data: posts, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const total = count ?? 0

  return NextResponse.json({
    data: posts,
    meta: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
      // Let the client know if this is a personalised or public feed
      is_personalised: followingIds.length > 0,
    },
  })
}