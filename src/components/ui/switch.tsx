import { cn } from "@/lib/utils"

export function Switch({
                           checked,
                           onChange,
                           className,
                           ...props
                       }: React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <label className={cn("inline-flex items-center gap-2 cursor-pointer select-none", className)}>
            <input
                type="checkbox"
                className="peer sr-only"
                checked={!!checked}
                onChange={onChange as any}
                {...props}
            />
            <span className="relative w-10 h-6 rounded-full bg-gray-300 transition-colors peer-checked:bg-gray-900">
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
        </label>
    )
}