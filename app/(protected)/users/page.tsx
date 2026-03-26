"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"

interface User {
  id: string
  username: string
  first_name: string
  last_name: string
  avatar_url: string | null
  bio: string | null
}

interface Meta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export default function UsersPage() {
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState<Meta | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async (pageNum: number) => {
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/users?page=${pageNum}&limit=20`)
    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error || "Failed to load users")
      return
    }

    setUsers(json.data)
    setMeta(json.meta)
  }

  useEffect(() => {
    fetchUsers(page)
  }, [page])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-medium text-gray-900">People</h1>
          {meta && (
            <p className="text-xs text-gray-400 mt-1">{meta.total} members</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200
            rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-4
                  animate-pulse flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-32" />
                  <div className="h-2.5 bg-gray-200 rounded w-48" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && users.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">No users found.</p>
          </div>
        )}

        {/* Users list */}
        {!loading && users.length > 0 && (
          <div className="space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white border border-gray-200 rounded-xl p-4
                  hover:border-gray-300 transition cursor-pointer flex items-center gap-3"
                onClick={() => router.push(`/users/${user.id}`)}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center
                  justify-center text-sm font-medium text-gray-600 overflow-hidden flex-shrink-0">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    `${user.first_name[0]}${user.last_name[0]}`
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-400">@{user.username}</p>
                  {user.bio && (
                    <p className="text-xs text-gray-500 mt-1 truncate">{user.bio}</p>
                  )}
                </div>

                {/* Chevron */}
                <svg
                  className="w-4 h-4 text-gray-300 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5l7 7-7 7" />
                </svg>
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