import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"
import bcrypt from "bcryptjs"
import { z } from "zod"

const signupSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = signupSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Signup error:", error)
    
    // Provide more specific error messages
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }
    
    if (error?.code === 'P1001' || error?.message?.includes('Can\'t reach database server')) {
      return NextResponse.json(
        { error: "Database connection error. Please check your database configuration." },
        { status: 503 }
      )
    }
    
    // Log full error in development, but don't expose it in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error?.message || "Internal server error"
      : "Internal server error"
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

