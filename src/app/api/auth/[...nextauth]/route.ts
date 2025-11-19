import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// In NextAuth v5 beta, NextAuth() returns an object with handlers and auth
const nextAuth = NextAuth(authOptions)

export const { handlers, auth } = nextAuth

export const { GET, POST } = handlers
