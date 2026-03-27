import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// GET /api/users/[user_id]/followers/ — list users who follow this user
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
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")))
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

  const { data, error, count } = await supabase
    .from("follows")
    .select(
      `follower:profiles!follows_follower_id_fkey(id, username, first_name, last_name, avatar_url, bio)`,
      { count: "exact" }
    )
    .eq("following_id", user_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const total = count ?? 0

  return NextResponse.json({
    data: data.map((d) => d.follower),
    meta: { page, limit, total, total_pages: Math.ceil(total / limit) },
  })
}