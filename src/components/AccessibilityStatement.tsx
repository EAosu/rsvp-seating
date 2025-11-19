"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Info } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"

export default function AccessibilityStatement() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(true)}
                className="text-sm"
                style={{
                    background: 'rgba(255, 255, 255, 0.5)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                }}
                aria-label="הצג הצהרת נגישות"
            >
                <Info className="h-4 w-4 ml-1" aria-hidden="true" />
                נגישות
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent 
                    className="bg-white"
                    role="dialog"
                    aria-labelledby="accessibility-title"
                    aria-modal="true"
                >
                    <DialogHeader className="pb-4 border-b border-gray-200 flex-shrink-0">
                        <DialogClose
                            onClose={() => setIsOpen(false)}
                            aria-label="סגור חלון"
                        />
                        <DialogTitle id="accessibility-title" className="text-2xl">
                            הצהרת נגישות
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 mt-6 text-gray-900 flex-grow overflow-y-auto">
                        <section>
                            <h2 className="text-lg font-semibold mb-3 text-gray-900">מחויבות לנגישות</h2>
                            <p className="text-gray-700 leading-relaxed">
                                אנו מחויבים להבטיח שהאתר שלנו נגיש לכל המשתמשים, כולל אנשים עם מוגבלויות.
                                האתר תואם לתקן הישראלי 5568 (תואם ל-WCAG 2.1 רמה AA).
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold mb-3 text-gray-900">תכונות נגישות</h2>
                            <ul className="list-disc list-inside space-y-2.5 text-gray-700 leading-relaxed">
                                <li>ניווט מקלדת מלא - כל הפונקציות נגישות באמצעות מקלדת</li>
                                <li>תמיכה בקוראי מסך - תואם לקוראי מסך מובילים</li>
                                <li>ניגודיות צבעים - עומד בתקני ניגודיות מינימליים</li>
                                <li>תוויות וטקסט חלופי - כל התמונות והאלמנטים כוללים תיאורים</li>
                                <li>מבנה לוגי - כותרות ומבנה תוכן היררכי</li>
                                <li>טפסים נגישים - כל השדות כוללים תוויות וטיפול בשגיאות</li>
                                <li>תמיכה ב-RTL - תמיכה מלאה בעברית וכיוון מימין לשמאל</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold mb-3 text-gray-900">שימוש במקלדת</h2>
                            <ul className="list-disc list-inside space-y-2.5 text-gray-700 leading-relaxed">
                                <li><kbd className="px-2.5 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono text-gray-800">Tab</kbd> - מעבר בין אלמנטים</li>
                                <li><kbd className="px-2.5 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono text-gray-800">Shift + Tab</kbd> - חזרה לאחור</li>
                                <li><kbd className="px-2.5 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono text-gray-800">Enter</kbd> - הפעלת כפתורים וקישורים</li>
                                <li><kbd className="px-2.5 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono text-gray-800">Escape</kbd> - סגירת חלונות</li>
                                <li><kbd className="px-2.5 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono text-gray-800">חצים</kbd> - ניווט בתפריטים</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-semibold mb-3 text-gray-900">דיווח על בעיות נגישות</h2>
                            <p className="text-gray-700 leading-relaxed">
                                אם נתקלת בבעיית נגישות באתר, אנא צור איתנו קשר ונשמח לעזור.
                            </p>
                        </section>

                        <div className="flex justify-end pt-4 border-t">
                            <Button onClick={() => setIsOpen(false)}>
                                סגור
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

