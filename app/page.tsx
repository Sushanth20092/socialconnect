"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function Home() {
  useEffect(() => {
    const test = async () => {
      const { data, error } = await supabase.auth.getSession()
      console.log("Session:", data, error)
    }

    test()
  }, [])

  return <h1>Supabase Connected ✅</h1>
}