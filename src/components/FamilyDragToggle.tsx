"use client"

import { cn } from "@/lib/utils"

export default function FamilyDragToggle({
                                             value,
                                             onChange,
                                             className,
                                         }: { value: boolean; onChange: (v: boolean) => void; className?: string }) {
    return (
        <div className="mt-4 mb-2 flex flex-wrap gap-8 items-center">
            <label className={cn(
                "inline-flex items-center gap-2 text-sm rounded-2xl border px-3 py-2 bg-white hover:bg-gray-50 cursor-pointer",
                className
            )}>
                <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <span>גרור משפחה שלמה</span>
                <span className="text-gray-400">·</span>
                <span className="inline-flex items-center gap-1 text-gray-600">
        לחיצה על 👪 או <kbd className="border rounded px-1 text-xs bg-gray-50">Shift</kbd> לגרירה חד־פעמית
                </span>
            </label>s
        </div>
    )
}
