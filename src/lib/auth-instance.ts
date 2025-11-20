import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import { authOptions } from "@/lib/auth"

// In NextAuth v5 beta, NextAuth() returns an object with handlers and auth
const nextAuth = NextAuth(authOptions as NextAuthConfig)

// Export auth for use in other files (not from route file)
export const { auth } = nextAuth

// Export handlers for the route file
export const { handlers } = nextAuth

