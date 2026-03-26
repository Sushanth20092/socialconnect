"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function SplashPage() {
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace("/home")
      } else {
        router.replace("/login")
      }
    }
    check()
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
          <circle cx="5"  cy="5"  r="2.5" fill="white" />
          <circle cx="11" cy="5"  r="2.5" fill="white" opacity="0.5" />
          <circle cx="8"  cy="11" r="2.5" fill="white" opacity="0.75" />
        </svg>
      </div>
      <p className="text-sm text-gray-400">Loading...</p>
    </div>
  )
}