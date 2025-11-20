import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// In NextAuth v5 beta, NextAuth() returns an object with handlers and auth
const nextAuth = NextAuth(authOptions)

const { handlers, auth: authHandler } = nextAuth

// Export GET and POST handlers directly for Next.js route
export const { GET, POST } = handlers

// Export auth for use in other files
export const auth = authHandler
