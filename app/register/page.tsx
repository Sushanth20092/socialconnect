"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signUp } from "@/lib/auth"

interface FormFields {
  email: string
  password: string
  username: string
  firstName: string
  lastName: string
}

interface FormErrors {
  email?: string
  password?: string
  username?: string
  firstName?: string
  lastName?: string
  general?: string
}

export default function RegisterPage() {
  const router = useRouter()

  const [form, setForm] = useState<FormFields>({
    email: "",
    password: "",
    username: "",
    firstName: "",
    lastName: "",
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }))
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/

    if (!form.firstName) newErrors.firstName = "Required"
    if (!form.lastName) newErrors.lastName = "Required"

    if (!form.username) newErrors.username = "Required"
    else if (!usernameRegex.test(form.username))
      newErrors.username = "3–30 chars, letters/numbers/underscore only"

    if (!form.email) newErrors.email = "Required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Enter a valid email address"

    if (!form.password) newErrors.password = "Required"
    else if (form.password.length < 6)
      newErrors.password = "Must be at least 6 characters"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleRegister = async () => {
    if (!validate()) return
    setLoading(true)

    const { error } = await signUp(
      form.email,
      form.password,
      form.username,
      form.firstName,
      form.lastName
    )

    setLoading(false)

    if (error) {
      setErrors({ general: error.message })
    } else {
      router.push("/login?registered=true")
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

        <h1 className="text-xl font-medium text-gray-900 mb-1">Create your account</h1>
        <p className="text-sm text-gray-500 mb-5">Join and start sharing with the world</p>

        {errors.general && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {errors.general}
          </div>
        )}

        {/* First + Last name row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {(["firstName", "lastName"] as const).map((name) => (
            <div key={name}>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {name === "firstName" ? "First name" : "Last name"}
              </label>
              <input
                name={name}
                type="text"
                placeholder={name === "firstName" ? "Jane" : "Doe"}
                value={form[name]}
                onChange={handleChange}
                className={`w-full h-9 px-3 text-sm rounded-lg border bg-gray-50 outline-none transition
                  focus:border-gray-400 focus:ring-2 focus:ring-black/5
                  ${errors[name] ? "border-red-400 bg-red-50" : "border-gray-200"}`}
              />
              {errors[name] && (
                <p className="text-xs text-red-500 mt-1">{errors[name]}</p>
              )}
            </div>
          ))}
        </div>

        {/* Remaining fields */}
        {(
          [
            { name: "username", label: "Username",  type: "text",     placeholder: "jane_doe"          },
            { name: "email",    label: "Email",     type: "email",    placeholder: "jane@example.com"  },
            { name: "password", label: "Password",  type: "password", placeholder: "Min. 6 characters" },
          ] as const
        ).map(({ name, label, type, placeholder }) => (
          <div key={name} className="mb-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
            <input
              name={name}
              type={type}
              placeholder={placeholder}
              value={form[name]}
              onChange={handleChange}
              className={`w-full h-9 px-3 text-sm rounded-lg border bg-gray-50 outline-none transition
                focus:border-gray-400 focus:ring-2 focus:ring-black/5
                ${errors[name] ? "border-red-400 bg-red-50" : "border-gray-200"}`}
            />
            {errors[name] && (
              <p className="text-xs text-red-500 mt-1">{errors[name]}</p>
            )}
          </div>
        ))}

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full h-9 mt-1 bg-black text-white text-sm font-medium rounded-lg
            hover:opacity-85 disabled:opacity-40 transition"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <hr className="my-4 border-gray-100" />

        <p className="text-center text-xs text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="text-black underline">Sign in</a>
        </p>
      </div>
    </div>
  )
}