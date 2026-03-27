import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// GET /api/users/me/ — fetch own profile
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

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, first_name, last_name, bio, avatar_url, website, location, email, created_at")
    .eq("id", user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 })
  }

  const { count: posts_count } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", user.id)
    .eq("is_active", true)

  return NextResponse.json({ data: { ...profile, posts_count: posts_count ?? 0 } })
}

// PUT /api/users/me/ — full update own profile
export async function PUT(req: NextRequest) {
  return updateProfile(req)
}

// PATCH /api/users/me/ — partial update own profile
export async function PATCH(req: NextRequest) {
  return updateProfile(req)
}

async function updateProfile(req: NextRequest) {
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

  // Only these fields are updatable
  const allowedFields = ["bio", "avatar_url", "website", "location", "first_name", "last_name"]
  const updates: Record<string, string> = {}

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  if (updates.bio && updates.bio.length > 160) {
    return NextResponse.json({ error: "Bio must be 160 characters or less" }, { status: 400 })
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  updates["updated_at"] = new Date().toISOString()

  const { data: profile, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("id, username, first_name, last_name, bio, avatar_url, website, location, email, updated_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: profile })
}