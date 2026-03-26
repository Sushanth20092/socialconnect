"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Navbar from "@/components/navbar"

interface Author {
  id: string
  username: string
  first_name: string
  last_name: string
  avatar_url: string | null
}

interface Post {
  id: string
  content: string
  image_url: string | null
  like_count: number
  comment_count: number
  created_at: string
  updated_at: string
  author: Author
}

export default function PostDetailPage() {
  const router = useRouter()
  const { post_id } = useParams()

  const [post, setPost] = useState<Post | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit state
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState("")
  const [editImage, setEditImage] = useState<File | null>(null)
  const [editPreview, setEditPreview] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete state
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) setCurrentUserId(session.user.id)
      await fetchPost()
    }
    init()
  }, [post_id])

  const fetchPost = async () => {
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/posts/${post_id}`)
    const json = await res.json()

    setLoading(false)

    if (!res.ok) {
      setError(json.error || "Post not found")
      return
    }

    setPost(json.data)
    setEditContent(json.data.content)
    setEditPreview(json.data.image_url)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setEditError(null)

    if (!file) return

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setEditError("Only JPEG and PNG images are allowed")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setEditError("Image must be 2MB or less")
      return
    }

    setEditImage(file)
    setEditPreview(URL.createObjectURL(file))
  }

  const handleUpdate = async () => {
    setEditError(null)

    if (!editContent.trim()) {
      setEditError("Content is required")
      return
    }

    if (editContent.length > 280) {
      setEditError("Content must be 280 characters or less")
      return
    }

    setEditLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.replace("/login")
      return
    }

    const formData = new FormData()
    formData.append("content", editContent.trim())
    if (editImage) formData.append("image", editImage)

    const res = await fetch(`/api/posts/${post_id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: formData,
    })

    const json = await res.json()
    setEditLoading(false)

    if (!res.ok) {
      setEditError(json.error || "Failed to update post")
      return
    }

    setPost(json.data)
    setEditing(false)
    setEditImage(null)
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return

    setDeleteLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.replace("/login")
      return
    }

    const res = await fetch(`/api/posts/${post_id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    setDeleteLoading(false)

    if (!res.ok) {
      const json = await res.json()
      setError(json.error || "Failed to delete post")
      return
    }

    router.replace("/home")
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const isOwner = post && currentUserId === post.author.id

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-8">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-700 mb-6 flex items-center gap-1 transition"
        >
          ← Back
        </button>

        {/* Loading */}
        {loading && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="h-3 bg-gray-200 rounded w-32" />
            </div>
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200
            rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Post */}
        {!loading && post && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">

            {/* Author */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center
                  justify-center text-xs font-medium text-gray-600 overflow-hidden">
                  {post.author.avatar_url ? (
                    <img
                      src={post.author.avatar_url}
                      alt={post.author.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    `${post.author.first_name[0]}${post.author.last_name[0]}`
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {post.author.first_name} {post.author.last_name}
                  </p>
                  <p className="text-xs text-gray-400">
                    @{post.author.username} · {formatDate(post.created_at)}
                  </p>
                </div>
              </div>

              {/* Owner actions */}
              {isOwner && !editing && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs text-gray-500 px-3 py-1.5 border border-gray-200
                      rounded-lg hover:bg-gray-50 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="text-xs text-red-500 px-3 py-1.5 border border-red-200
                      rounded-lg hover:bg-red-50 disabled:opacity-40 transition"
                  >
                    {deleteLoading ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>

            {/* View mode */}
            {!editing && (
              <>
                <p className="text-sm text-gray-800 leading-relaxed mb-4">
                  {post.content}
                </p>

                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post image"
                    className="w-full max-h-96 object-cover rounded-lg border
                      border-gray-100 mb-4"
                  />
                )}

                <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{post.like_count} likes</span>
                  <span className="text-xs text-gray-400">{post.comment_count} comments</span>
                </div>
              </>
            )}

            {/* Edit mode */}
            {editing && (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => {
                    setEditContent(e.target.value)
                    setEditError(null)
                  }}
                  rows={4}
                  className="w-full text-sm text-gray-900 bg-gray-50 border border-gray-200
                    rounded-lg px-3 py-2 outline-none resize-none transition
                    focus:border-gray-400 focus:ring-2 focus:ring-black/5"
                />
                <p className={`text-xs text-right ${
                  editContent.length > 280 ? "text-red-500" : "text-gray-400"
                }`}>
                  {editContent.length}/280
                </p>

                {/* Image preview */}
                {editPreview && (
                  <div className="relative">
                    <img
                      src={editPreview}
                      alt="Preview"
                      className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => {
                        setEditImage(null)
                        setEditPreview(null)
                      }}
                      className="absolute top-2 right-2 bg-black text-white text-xs
                        px-2 py-1 rounded-md hover:opacity-80 transition"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {editError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200
                    rounded-lg px-3 py-2">
                    {editError}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <label className="cursor-pointer text-sm text-gray-500 hover:text-gray-900
                    border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
                    Change image
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(false)
                        setEditContent(post.content)
                        setEditPreview(post.image_url)
                        setEditImage(null)
                        setEditError(null)
                      }}
                      className="text-sm text-gray-500 px-4 py-1.5 rounded-lg
                        hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdate}
                      disabled={editLoading || editContent.length > 280}
                      className="text-sm bg-black text-white px-4 py-1.5 rounded-lg
                        hover:opacity-85 disabled:opacity-40 transition"
                    >
                      {editLoading ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}