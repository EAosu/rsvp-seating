import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import { authOptions } from "@/lib/auth"

// Validate required environment variables
const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
if (!secret) {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "ERROR: NEXTAUTH_SECRET or AUTH_SECRET environment variable is required for production. " +
      "Please set it in your Vercel environment variables."
    )
  } else {
    console.warn(
      "Warning: NEXTAUTH_SECRET or AUTH_SECRET is not set. " +
      "Authentication may not work properly."
    )
  }
}

// In NextAuth v5 beta, NextAuth() returns an object with handlers and auth
const nextAuth = NextAuth(authOptions as NextAuthConfig)

// Export auth for use in other files (not from route file)
export const { auth } = nextAuth

// Export handlers for the route file
export const { handlers } = nextAuth

