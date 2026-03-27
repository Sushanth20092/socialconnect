import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// GET /api/users/[user_id]/posts/ — get paginated posts by a specific user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") ?? "10")))
  const offset = (page - 1) * limit

  // Verify user exists
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user_id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const { data: posts, error, count } = await supabase
    .from("posts")
    .select(
      `id, content, image_url, like_count, comment_count, created_at, updated_at,
       author:profiles(id, username, first_name, last_name, avatar_url)`,
      { count: "exact" }
    )
    .eq("author_id", user_id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const total = count ?? 0

  return NextResponse.json({
    data: posts,
    meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
  })
}