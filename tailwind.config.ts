import type { Config } from "tailwindcss"

export default {
    content: ["./src/**/*.{ts,tsx}"],
    theme: {
        container: { center: true, padding: "2rem" },
        extend: {
            borderRadius: { lg: "var(--radius)", md: "calc(var(--radius)-2px)", sm: "calc(var(--radius)-4px)" },
            keyframes: {
                "accordion-down": { from: { height: 0 }, to: { height: "var(--radix-accordion-content-height)" } },
                "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: 0 } },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
            },
        },
    },
    plugins: [
        require("tailwindcss-animate"),
        require("@tailwindcss/forms"),
        require("postcss-rtl")(), // מאפשר כתיבה RTL נוחה
    ],
} satisfies Config
