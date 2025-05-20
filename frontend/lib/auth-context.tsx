"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { api } from "./api"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (credentials: { email: string; password: string }) => Promise<User>
  register: (userData: { name: string; email: string; password: string; role: string }) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token")
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
      fetchCurrentUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchCurrentUser = async () => {
    try {
      console.log("Fetching current user...")
      const response = await api.get("/api/me")
      console.log("Current user data:", response.data)
      setUser(response.data)
    } catch (error) {
      console.error("Error fetching current user:", error)
      localStorage.removeItem("token")
      delete api.defaults.headers.common["Authorization"]
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: { email: string; password: string }): Promise<User> => {
    const response = await api.post("/api/login", credentials)
    const { token, user } = response.data

    localStorage.setItem("token", token)
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`
    setUser(user)

    return user
  }

  const register = async (userData: { name: string; email: string; password: string; role: string }): Promise<User> => {
    const response = await api.post("/api/register", userData)
    const { token, user } = response.data

    localStorage.setItem("token", token)
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`
    setUser(user)

    return user
  }

  const logout = () => {
    localStorage.removeItem("token")
    delete api.defaults.headers.common["Authorization"]
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
