"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  author: Author
}

interface Meta {
  page: number
  limit: number
  total: number
  total_pages: number
  is_personalised: boolean
}

export default function FeedPage() {
  const router = useRouter()

  const [posts, setPosts] = useState<Post[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})
  const [likeLoadingMap, setLikeLoadingMap] = useState<Record<string, boolean>>({})

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  const fetchFeed = async (pageNum: number) => {
    setLoading(true)
    setError(null)

    const token = await getToken()
    if (!token) { router.replace("/login"); return }

    const res = await fetch(`/api/feed?page=${pageNum}&limit=10`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error || "Failed to load feed")
      return
    }

    setPosts(json.data)
    setMeta(json.meta)
    checkLikedBatch(json.data, token)
  }

  const checkLikedBatch = async (postList: Post[], token: string) => {
    const results = await Promise.all(
      postList.map((p) =>
        fetch(`/api/posts/${p.id}/like`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((r) => r.json()).then((j) => ({ id: p.id, liked: j.liked ?? false }))
      )
    )
    const map: Record<string, boolean> = {}
    results.forEach(({ id, liked }) => { map[id] = liked })
    setLikedMap(map)
  }

  const handleLike = async (postId: string) => {
    const token = await getToken()
    if (!token) { router.replace("/login"); return }

    const isLiked = likedMap[postId] ?? false
    setLikeLoadingMap((prev) => ({ ...prev, [postId]: true }))

    const res = await fetch(`/api/posts/${postId}/like`, {
      method: isLiked ? "DELETE" : "POST",
      headers: { Authorization: `Bearer ${token}` },
    })

    setLikeLoadingMap((prev) => ({ ...prev, [postId]: false }))

    if (res.ok) {
      setLikedMap((prev) => ({ ...prev, [postId]: !isLiked }))
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, like_count: isLiked ? p.like_count - 1 : p.like_count + 1 }
            : p
        )
      )
    }
  }

  useEffect(() => {
    fetchFeed(page)
  }, [page])

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-medium text-gray-900">Your Feed</h1>
            {meta && (
              <p className="text-xs text-gray-400 mt-0.5">
                {meta.is_personalised
                  ? "Posts from people you follow"
                  : "Follow people to personalise your feed"}
              </p>
            )}
          </div>
          <button
            onClick={() => router.push("/users")}
            className="text-sm border border-gray-200 px-4 py-1.5 rounded-lg
              hover:bg-gray-50 transition text-gray-700"
          >
            Find people
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200
            rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5
                animate-pulse space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  <div className="h-3 bg-gray-200 rounded w-32" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">
              {meta?.is_personalised
                ? "No posts from people you follow yet."
                : "You're not following anyone yet."}
            </p>
            <button
              onClick={() => router.push("/users")}
              className="mt-3 text-sm text-black underline"
            >
              Find people to follow
            </button>
          </div>
        )}

        {/* Posts */}
        {!loading && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white border border-gray-200 rounded-xl p-5
                  hover:border-gray-300 transition cursor-pointer"
                onClick={() => router.push(`/post/${post.id}`)}
              >
                {/* Author */}
                <div
                  className="flex items-center gap-3 mb-3"
                  onClick={(e) => { e.stopPropagation(); router.push(`/users/${post.author.id}`) }}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center
                    justify-center text-xs font-medium text-gray-600 overflow-hidden">
                    {post.author.avatar_url ? (
                      <img src={post.author.avatar_url} alt={post.author.username}
                        className="w-full h-full object-cover" />
                    ) : (
                      `${post.author.first_name[0]}${post.author.last_name[0]}`
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 hover:underline">
                      {post.author.first_name} {post.author.last_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      @{post.author.username} · {formatDate(post.created_at)}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm text-gray-800 leading-relaxed mb-3">{post.content}</p>

                {/* Image */}
                {post.image_url && (
                  <img src={post.image_url} alt="Post image"
                    className="w-full max-h-72 object-cover rounded-lg border
                      border-gray-100 mb-3" />
                )}

                {/* Stats + Like */}
                <div
                  className="flex items-center gap-3 pt-2 border-t border-gray-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleLike(post.id)}
                    disabled={likeLoadingMap[post.id]}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg
                      border transition disabled:opacity-40
                      ${likedMap[post.id]
                        ? "bg-red-50 border-red-200 text-red-500"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                  >
                    {likedMap[post.id] ? "♥" : "♡"}
                    <span>{post.like_count} {post.like_count === 1 ? "like" : "likes"}</span>
                  </button>

                  <span
                    className="text-xs text-gray-400 cursor-pointer hover:text-gray-600"
                    onClick={() => router.push(`/post/${post.id}`)}
                  >
                    {post.comment_count} {post.comment_count === 1 ? "comment" : "comments"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.total_pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="text-sm text-gray-500 px-4 py-1.5 border border-gray-200
                rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
            >
              Previous
            </button>
            <span className="text-xs text-gray-400">
              Page {meta.page} of {meta.total_pages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === meta.total_pages}
              className="text-sm text-gray-500 px-4 py-1.5 border border-gray-200
                rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
            >
              Next
            </button>
          </div>
        )}

      </main>
    </div>
  )
}