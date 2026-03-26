"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import Navbar from "@/components/navbar"

export default function CreatePostPage() {
  const router = useRouter()

  const [content, setContent] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setError(null)

    if (!file) return

    // Validate type
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Only JPEG and PNG images are allowed")
      return
    }

    // Validate size
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be 2MB or less")
      return
    }

    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    setError(null)

    if (!content.trim()) {
      setError("Content is required")
      return
    }

    if (content.length > 280) {
      setError("Content must be 280 characters or less")
      return
    }

    setLoading(true)

    // Get session token
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.replace("/login")
      return
    }

    // Build form data
    const formData = new FormData()
    formData.append("content", content.trim())
    if (image) formData.append("image", image)

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    })

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error || "Something went wrong")
      return
    }

    // Success — go to home feed
    router.replace("/home")
  }

  const removeImage = () => {
    setImage(null)
    setPreview(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-xl font-medium text-gray-900 mb-6">Create post</h1>

        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">

          {/* Content */}
          <div>
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                setError(null)
              }}
              placeholder="What's on your mind?"
              rows={4}
              className="w-full text-sm text-gray-900 bg-gray-50 border border-gray-200
                rounded-lg px-3 py-2 outline-none resize-none transition
                focus:border-gray-400 focus:ring-2 focus:ring-black/5"
            />
            {/* Character count */}
            <p className={`text-xs mt-1 text-right ${
              content.length > 280 ? "text-red-500" : "text-gray-400"
            }`}>
              {content.length}/280
            </p>
          </div>

          {/* Image preview */}
          {preview && (
            <div className="relative w-full">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-64 object-cover rounded-lg border border-gray-200"
              />
              <button
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black text-white text-xs
                  px-2 py-1 rounded-md hover:opacity-80 transition"
              >
                Remove
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200
              rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {/* Image upload */}
            <label className="cursor-pointer text-sm text-gray-500 hover:text-gray-900
              border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition">
              {image ? "Change image" : "Add image"}
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>

            <div className="flex gap-2">
              <button
                onClick={() => router.back()}
                className="text-sm text-gray-500 px-4 py-1.5 rounded-lg
                  hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || content.length > 280}
                className="text-sm bg-black text-white px-4 py-1.5 rounded-lg
                  hover:opacity-85 disabled:opacity-40 transition"
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}