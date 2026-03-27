import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// GET /api/users/[user_id]/follow/ — check if current user follows this user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params

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

  const { data: follow } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", user_id)
    .single()

  return NextResponse.json({ following: !!follow })
}

// POST /api/users/[user_id]/follow/ — follow a user
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params

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

  // Can't follow yourself
  if (user.id === user_id) {
    return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 })
  }

  // Check target user exists
  const { data: targetUser, error: userError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user_id)
    .single()

  if (userError || !targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Check already following
  const { data: existingFollow } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", user_id)
    .single()

  if (existingFollow) {
    return NextResponse.json({ error: "Already following" }, { status: 409 })
  }

  // Insert follow
  const { error: followError } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id: user_id })

  if (followError) {
    return NextResponse.json({ error: followError.message }, { status: 500 })
  }

  return NextResponse.json({ message: "Followed" }, { status: 201 })
}

// DELETE /api/users/[user_id]/follow/ — unfollow a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  const { user_id } = await params

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

  const { error: deleteError, count } = await supabase
    .from("follows")
    .delete({ count: "exact" })
    .eq("follower_id", user.id)
    .eq("following_id", user_id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  if (count === 0) {
    return NextResponse.json({ error: "Not following this user" }, { status: 404 })
  }

  return NextResponse.json({ message: "Unfollowed" }, { status: 200 })
}