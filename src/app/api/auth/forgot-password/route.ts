import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"
import { z } from "zod"
import { randomBytes } from "crypto"

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = forgotPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      )
    }

    const { email } = parsed.data

    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Don't reveal if user exists or not (security best practice)
    if (!user) {
      return NextResponse.json(
        { message: "If an account exists with this email, a password reset link has been sent." },
        { status: 200 }
      )
    }

    // Generate reset token
    const token = randomBytes(32).toString("hex")
    const expires = new Date()
    expires.setHours(expires.getHours() + 1) // Token expires in 1 hour

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expires,
      },
    })

    // TODO: Send email with reset link
    // For now, we'll just return the token in development
    // In production, you should send an email with the reset link
    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`

    // In production, use an email service like Resend, SendGrid, etc.
    console.log("Password reset link (dev only):", resetUrl)

    return NextResponse.json(
      { message: "If an account exists with this email, a password reset link has been sent." },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("Forgot password error:", error)
    
    // Provide more specific error messages
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

