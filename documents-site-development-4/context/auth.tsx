"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

interface AuthContextType {
  isAuthenticated: boolean
  isAdmin: boolean
  user: { id: string; email: string; isAdmin: boolean; firstName?: string } | null
  login: (user?: { id: string; email: string; isAdmin: boolean; firstName?: string }) => void
  logout: () => void
  loading: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<{ id: string; email: string; isAdmin: boolean; firstName?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const isLoading = loading
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = () => {
      try {
        // Check localStorage first
        const storedUser = localStorage.getItem("user")
        const storedAuth = localStorage.getItem("isAuthenticated") || localStorage.getItem("userLoggedIn")
        const storedEmail = localStorage.getItem("userEmail")
        const storedAdmin = localStorage.getItem("userIsAdmin")

        console.log("[v0] Auth check:", { storedUser, storedAuth, storedEmail, storedAdmin })

        if (storedAuth === "true" || (storedUser && storedEmail)) {
          let userData
          if (storedUser) {
            userData = JSON.parse(storedUser)
          } else if (storedEmail) {
            userData = {
              id: `user-${Date.now()}`,
              email: storedEmail,
              isAdmin: false,
            }
          }

          if (userData) {
            const isUserAdmin = storedAdmin === "true" || userData.isAdmin === true

            setUser({ ...userData, isAdmin: isUserAdmin })
            setIsAuthenticated(true)
            setIsAdmin(isUserAdmin)

            console.log("[v0] User authenticated:", { ...userData, isAdmin: isUserAdmin })
          }
        }
      } catch (error) {
        console.error("[v0] Auth check failed:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = (userData?: { id: string; email: string; isAdmin: boolean; firstName?: string }) => {
    const defaultUser = userData || {
      id: "test-user-1",
      email: "test@example.com",
      isAdmin: false,
    }

    console.log("Login called with:", defaultUser)

    // Set cookies for middleware
    document.cookie = `userLoggedIn=true; path=/; max-age=86400`
    document.cookie = `userIsAdmin=${defaultUser.isAdmin}; path=/; max-age=86400`
    document.cookie = `session=test-session-${defaultUser.id}; path=/; max-age=86400`

    // Store user data in localStorage for persistence
    localStorage.setItem("user", JSON.stringify(defaultUser))
    localStorage.setItem("isAuthenticated", "true")
    localStorage.setItem("userIsAdmin", defaultUser.isAdmin.toString())

    setUser(defaultUser)
    setIsAuthenticated(true)
    setIsAdmin(defaultUser.isAdmin)
    setLoading(false)

    console.log("User logged in:", defaultUser)
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      // Clear all auth cookies
      document.cookie = "userLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      document.cookie = "userIsAdmin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      document.cookie = "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"

      // Clear localStorage
      localStorage.removeItem("user")
      localStorage.removeItem("isAuthenticated")
      localStorage.removeItem("userIsAdmin")
      localStorage.removeItem("rememberMe")
      localStorage.removeItem("adminUser")

      setUser(null)
      setIsAuthenticated(false)
      setIsAdmin(false)

      // Redirect to login page
      router.push("/login")
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, user, login, logout, loading, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
