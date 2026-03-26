"use client"

import { useRouter, usePathname } from "next/navigation"
import { signOut } from "@/lib/auth"

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    await signOut()
    router.replace("/login")
  }

  const navItems = [
    { label: "Home",    href: "/home"    },
    { label: "Users",   href: "/users"   },
    { label: "Profile", href: "/profile" },
    { label: "Post",    href: "/post"    },
  ]

  return (
    <nav className="border-b border-gray-100 bg-white px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="5"  cy="5"  r="2.5" fill="white" />
            <circle cx="11" cy="5"  r="2.5" fill="white" opacity="0.5" />
            <circle cx="8"  cy="11" r="2.5" fill="white" opacity="0.75" />
          </svg>
        </div>
        <span className="text-sm font-medium">SocialConnect</span>
      </div>

      <div className="flex items-center gap-1">
        {navItems.map(({ label, href }) => (
          <button
            key={href}
            onClick={() => router.push(href)}
            className={`px-3 py-1.5 text-sm rounded-lg transition
              ${pathname === href
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="text-sm text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
      >
        Sign out
      </button>
    </nav>
  )
}