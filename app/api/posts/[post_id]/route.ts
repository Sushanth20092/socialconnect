import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ post_id: string }> }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { post_id } = await params

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

//Update
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ post_id: string }> }
) {
  // Check auth
  const authHeader = req.headers.get("authorization")
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.replace("Bearer ", "")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { post_id } = await params

  // Check post exists and belongs to user
  const { data: existing, error: fetchError } = await supabase
    .from("posts")
    .select("id, author_id")
    .eq("id", post_id)
    .eq("is_active", true)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  if (existing.author_id !== user.id) {
    return NextResponse.json(
      { error: "You can only edit your own posts" },
      { status: 403 }
    )
  }

  // Parse form data
  const formData = await req.formData()
  const content = formData.get("content") as string | null
  const image = formData.get("image") as File | null

  // Validate content
  if (!content || content.trim() === "") {
    return NextResponse.json({ error: "Content is required" }, { status: 400 })
  }

  if (content.length > 280) {
    return NextResponse.json(
      { error: "Content must be 280 characters or less" },
      { status: 400 }
    )
  }

  let image_url: string | null = null

  // Handle new image upload if provided
  if (image && image.size > 0) {
    const allowedTypes = ["image/jpeg", "image/png"]
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { error: "Only JPEG and PNG images are allowed" },
        { status: 400 }
      )
    }

    const maxSize = 2 * 1024 * 1024
    if (image.size > maxSize) {
      return NextResponse.json(
        { error: "Image must be 2MB or less" },
        { status: 400 }
      )
    }

    const fileExt = image.type === "image/png" ? "png" : "jpg"
    const fileName = `${user.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("posts")
      .upload(fileName, image, { contentType: image.type })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        { error: "Image upload failed" },
        { status: 500 }
      )
    }

    const { data: urlData } = supabase.storage
      .from("posts")
      .getPublicUrl(fileName)

    image_url = urlData.publicUrl
  }

  // Update post
  const { data: post, error: updateError } = await supabase
    .from("posts")
    .update({
      content: content.trim(),
      ...(image_url && { image_url }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", post_id)
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
    .single()

  if (updateError) {
    console.error("Update error:", updateError)
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 })
  }

  return NextResponse.json({ data: post }, { status: 200 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ post_id: string }> }
) {
  // Check auth
  const authHeader = req.headers.get("authorization")
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.replace("Bearer ", "")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { post_id } = await params

  // Check post exists and belongs to user
  const { data: existing, error: fetchError } = await supabase
    .from("posts")
    .select("id, author_id")
    .eq("id", post_id)
    .eq("is_active", true)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 })
  }

  if (existing.author_id !== user.id) {
    return NextResponse.json(
      { error: "You can only delete your own posts" },
      { status: 403 }
    )
  }

  // Soft delete — set is_active to false instead of removing from DB
  const { error: deleteError } = await supabase
    .from("posts")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", post_id)

  if (deleteError) {
    console.error("Delete error:", deleteError)
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 })
  }

  return NextResponse.json({ message: "Post deleted" }, { status: 200 })
}