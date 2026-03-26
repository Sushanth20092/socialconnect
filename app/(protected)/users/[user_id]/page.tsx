"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Navbar from "@/components/navbar"

interface Profile {
  id: string
  username: string
  first_name: string
  last_name: string
  bio: string | null
  avatar_url: string | null
  website: string | null
  location: string | null
  posts_count: number
}

interface Post {
  id: string
  content: string
  image_url: string | null
  like_count: number
  comment_count: number
  created_at: string
}

interface Meta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export default function UserProfilePage() {
  const router = useRouter()
  const { user_id } = useParams<{ user_id: string }>()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [page, setPage] = useState(1)
  const [profileLoading, setProfileLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    setProfileLoading(true)
    const res = await fetch(`/api/users/${user_id}`)
    const json = await res.json()
    setProfileLoading(false)

    if (!res.ok) {
      setError(json.error || "User not found")
      return
    }

    setProfile(json.data)
  }

  const fetchPosts = async (pageNum: number) => {
    setPostsLoading(true)
    const res = await fetch(`/api/users/${user_id}/posts?page=${pageNum}&limit=10`)
    const json = await res.json()
    setPostsLoading(false)

    if (!res.ok) {
      setError(json.error || "Failed to load posts")
      return
    }

    setPosts(json.data)
    setMeta(json.meta)
  }

  useEffect(() => {
    if (user_id) {
      fetchProfile()
      fetchPosts(page)
    }
  }, [user_id])

  useEffect(() => {
    if (user_id) fetchPosts(page)
  }, [page])

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32" />
                <div className="h-3 bg-gray-200 rounded w-20" />
              </div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-8 text-center">
          <p className="text-sm text-gray-500 mb-3">{error}</p>
          <button
            onClick={() => router.back()}
            className="text-sm text-black underline"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-8">

        {/* Profile card */}
        {profile && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center
                justify-center text-lg font-semibold text-gray-600 overflow-hidden flex-shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  `${profile.first_name[0]}${profile.last_name[0]}`
                )}
              </div>

              {/* Name & username */}
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {profile.first_name} {profile.last_name}
                </h1>
                <p className="text-sm text-gray-400">@{profile.username}</p>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="mt-4 text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
            )}

            {/* Location & website */}
            {(profile.location || profile.website) && (
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-400">
                {profile.location && <span>📍 {profile.location}</span>}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    🔗 {profile.website}
                  </a>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-center w-fit">
                <p className="text-base font-semibold text-gray-900">{profile.posts_count}</p>
                <p className="text-xs text-gray-400">Posts</p>
              </div>
            </div>
          </div>
        )}

        {/* Posts section */}
        <h2 className="text-sm font-medium text-gray-700 mb-4">
          Posts by @{profile?.username}
        </h2>

        {postsLoading && (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5
                animate-pulse space-y-3">
                <div className="h-3 bg-gray-200 rounded w-full" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {!postsLoading && posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No posts yet.</p>
          </div>
        )}

        {!postsLoading && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white border border-gray-200 rounded-xl p-5
                  hover:border-gray-300 transition cursor-pointer"
                onClick={() => router.push(`/post/${post.id}`)}
              >
                <p className="text-sm text-gray-800 leading-relaxed mb-3">{post.content}</p>

                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post image"
                    className="w-full max-h-60 object-cover rounded-lg border
                      border-gray-100 mb-3"
                  />
                )}

                <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{post.like_count} likes</span>
                  <span className="text-xs text-gray-400">{post.comment_count} comments</span>
                  <span className="text-xs text-gray-400 ml-auto">{formatDate(post.created_at)}</span>
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