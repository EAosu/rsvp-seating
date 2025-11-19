import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 backdrop-blur-sm border border-white/20",
        destructive:
          "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/50 hover:scale-105 active:scale-95 backdrop-blur-sm border border-white/20",
        outline:
          "border-2 border-white/40 bg-white/60 backdrop-blur-xl saturate-150 text-gray-800 shadow-md hover:bg-white/80 hover:border-white/60 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-indigo-500/20",
        secondary:
          "bg-white/60 backdrop-blur-xl saturate-150 border border-white/30 text-gray-800 shadow-md hover:bg-white/80 hover:shadow-lg hover:scale-105 active:scale-95",
        ghost:
          "hover:bg-white/60 hover:backdrop-blur-xl text-gray-700 hover:text-indigo-700 hover:scale-105 border border-transparent hover:border-white/30",
        link: "text-indigo-600 underline-offset-4 hover:underline hover:text-purple-600",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
