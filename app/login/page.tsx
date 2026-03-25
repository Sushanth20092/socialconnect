"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "@/lib/auth"

interface FormErrors {
  identifier?: string
  password?: string
  general?: string
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [justRegistered, setJustRegistered] = useState(false)

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setJustRegistered(true)
    }
  }, [searchParams])

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!identifier)
      newErrors.identifier = "Required"

    if (!password)
      newErrors.password = "Required"
    else if (password.length < 6)
      newErrors.password = "Must be at least 6 characters"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    setErrors({})
    if (!validate()) return

    setLoading(true)

    const { error } = await signIn(identifier.trim(), password)

    setLoading(false)

    if (error) {
      setErrors({ general: error.message })
    } else {
      router.push("/")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-md shadow-sm">

        {/* Brand */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 bg-black rounded-md flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="5"  cy="5"  r="2.5" fill="white" />
              <circle cx="11" cy="5"  r="2.5" fill="white" opacity="0.5" />
              <circle cx="8"  cy="11" r="2.5" fill="white" opacity="0.75" />
            </svg>
          </div>
          <span className="text-sm font-medium">SocialConnect</span>
        </div>

        <h1 className="text-xl font-medium text-gray-900 mb-1">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-5">Sign in with your email or username</p>

        {justRegistered && (
          <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
            Account created! Please sign in.
          </div>
        )}

        {errors.general && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {errors.general}
          </div>
        )}

        {/* Identifier */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Email or username
          </label>
          <input
            type="text"
            value={identifier}
            placeholder="jane@example.com or jane_doe"
            onChange={(e) => { setIdentifier(e.target.value); clearError("identifier") }}
            className={`w-full h-9 px-3 text-sm rounded-lg border bg-gray-50 outline-none transition
              focus:border-gray-400 focus:ring-2 focus:ring-black/5
              ${errors.identifier ? "border-red-400 bg-red-50" : "border-gray-200"}`}
          />
          {errors.identifier
            ? <p className="text-xs text-red-500 mt-1">{errors.identifier}</p>
            : <p className="text-xs text-gray-400 mt-1">You can use either your email address or username</p>
          }
        </div>

        {/* Password */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            placeholder="Your password"
            onChange={(e) => { setPassword(e.target.value); clearError("password") }}
            className={`w-full h-9 px-3 text-sm rounded-lg border bg-gray-50 outline-none transition
              focus:border-gray-400 focus:ring-2 focus:ring-black/5
              ${errors.password ? "border-red-400 bg-red-50" : "border-gray-200"}`}
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password}</p>
          )}
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full h-9 mt-1 bg-black text-white text-sm font-medium rounded-lg
            hover:opacity-85 disabled:opacity-40 transition"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <hr className="my-4 border-gray-100" />

        <p className="text-center text-xs text-gray-500">
          Don't have an account?{" "}
          <a href="/register" className="text-black underline">Create one</a>
        </p>
      </div>
    </div>
  )
}