import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  // Check auth
  const authHeader = req.headers.get("authorization")
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.replace("Bearer ", "")

  // Create authenticated client using user's token
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  )

  // Get user from token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Parse form data (supports both text and image)
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

  // Handle image upload if provided
  if (image) {
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

  // Insert post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert([{
      content: content.trim(),
      author_id: user.id,
      image_url,
      is_active: true,
    }])
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

  if (postError) {
    console.error("Post insert error:", postError)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }

  return NextResponse.json({ data: post }, { status: 201 })
}

// GET POST
export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Pagination query params
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const offset = (page - 1) * limit

  // Get total count for pagination meta
  const { count } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true)

  // Get posts
  const { data: posts, error } = await supabase
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
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Get posts error:", error)
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 })
  }

  return NextResponse.json({
    data: posts,
    meta: {
      page,
      limit,
      total: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / limit),
    },
  }, { status: 200 })
}