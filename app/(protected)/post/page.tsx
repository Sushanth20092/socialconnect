"use client"

import Navbar from "@/components/navbar"

export default function PostPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-medium text-gray-900">Create post</h1>
        {/* Post form goes here */}
      </main>
    </div>
  )
}