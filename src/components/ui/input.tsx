import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-gray-500 selection:bg-indigo-200 selection:text-indigo-900",
        "border-2 border-white/40 bg-white/60 backdrop-blur-xl saturate-150",
        "flex h-9 w-full min-w-0 rounded-xl px-3 py-1 text-base shadow-md",
        "transition-all duration-300 outline-none",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-300/50 focus-visible:shadow-lg focus-visible:shadow-indigo-500/20 focus-visible:bg-white/80",
        "hover:border-white/60 hover:shadow-lg hover:bg-white/70",
        "aria-invalid:ring-red-300/50 aria-invalid:border-red-400",
        className
      )}
      {...props}
    />
  )
}

export { Input }
