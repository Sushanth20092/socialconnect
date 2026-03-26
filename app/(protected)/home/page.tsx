"use client"

import Navbar from "@/components/navbar"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-xl font-medium text-gray-900">Home</h1>
        {/* Feed goes here */}
        <p className="text-sm text-gray-400">Your feed will appear here.</p>
      </main>
    </div>
  )
}