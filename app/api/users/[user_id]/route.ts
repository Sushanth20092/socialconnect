import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// GET /api/users/[user_id]/ — get any user's public profile
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, first_name, last_name, bio, avatar_url, website, location, created_at")
    .eq("id", user_id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const { count: posts_count } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", user_id)
    .eq("is_active", true)

  return NextResponse.json({ data: { ...profile, posts_count: posts_count ?? 0 } })
}