"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
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
  email: string | null
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

export default function ProfilePage() {
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [page, setPage] = useState(1)
  const [profileLoading, setProfileLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Edit modal
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    bio: "",
    avatar_url: "",
    website: "",
    location: "",
  })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }

  const fetchProfile = async () => {
    setProfileLoading(true)
    const token = await getToken()

    if (!token) {
      router.replace("/login")
      return
    }

    const res = await fetch("/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    setProfileLoading(false)

    if (!res.ok) {
      setError(json.error || "Failed to load profile")
      return
    }

    setProfile(json.data)
    setEditForm({
      first_name: json.data.first_name ?? "",
      last_name: json.data.last_name ?? "",
      bio: json.data.bio ?? "",
      avatar_url: json.data.avatar_url ?? "",
      website: json.data.website ?? "",
      location: json.data.location ?? "",
    })
  }

  const fetchPosts = async (pageNum: number, profileId: string) => {
    setPostsLoading(true)
    const res = await fetch(`/api/users/${profileId}/posts?page=${pageNum}&limit=10`)
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
    fetchProfile()
  }, [])

  useEffect(() => {
    if (profile) fetchPosts(page, profile.id)
  }, [profile, page])

  const handleEditSubmit = async () => {
    setEditLoading(true)
    setEditError(null)

    const token = await getToken()
    if (!token) {
      router.replace("/login")
      return
    }

    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(editForm),
    })

    const json = await res.json()
    setEditLoading(false)

    if (!res.ok) {
      setEditError(json.error || "Update failed")
      return
    }

    // Merge updated fields back into profile
    setProfile((prev) => prev ? { ...prev, ...json.data } : prev)
    setEditOpen(false)
  }

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
            <div className="h-3 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-8">
          <p className="text-sm text-red-600">{error}</p>
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
            <div className="flex items-start justify-between">
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

              {/* Edit button */}
              <button
                onClick={() => setEditOpen(true)}
                className="text-sm border border-gray-200 px-3 py-1.5 rounded-lg
                  hover:bg-gray-50 transition text-gray-700"
              >
                Edit profile
              </button>
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-700">Your posts</h2>
          <button
            onClick={() => router.push("/post")}
            className="text-sm bg-black text-white px-4 py-1.5 rounded-lg
              hover:opacity-85 transition"
          >
            New post
          </button>
        </div>

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
            <p className="text-gray-400 text-sm">You haven't posted anything yet.</p>
            <button
              onClick={() => router.push("/post")}
              className="mt-3 text-sm text-black underline"
            >
              Create your first post
            </button>
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

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Edit profile</h2>
              <button
                onClick={() => { setEditOpen(false); setEditError(null) }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* First / Last name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">First name</label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) => setEditForm((f) => ({ ...f, first_name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Last name</label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) => setEditForm((f) => ({ ...f, last_name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                      focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Bio{" "}
                  <span className={editForm.bio.length > 160 ? "text-red-500" : "text-gray-400"}>
                    ({editForm.bio.length}/160)
                  </span>
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
                />
              </div>

              {/* Avatar URL */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Avatar URL</label>
                <input
                  type="url"
                  value={editForm.avatar_url}
                  onChange={(e) => setEditForm((f) => ({ ...f, avatar_url: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>

              {/* Website */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Website</label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="City, Country"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm
                    focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>

              {/* Error */}
              {editError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200
                  rounded-lg px-3 py-2">
                  {editError}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => { setEditOpen(false); setEditError(null) }}
                  className="flex-1 text-sm border border-gray-200 px-4 py-2 rounded-lg
                    hover:bg-gray-50 transition text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={editLoading || editForm.bio.length > 160}
                  className="flex-1 text-sm bg-black text-white px-4 py-2 rounded-lg
                    hover:opacity-85 transition disabled:opacity-40"
                >
                  {editLoading ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}