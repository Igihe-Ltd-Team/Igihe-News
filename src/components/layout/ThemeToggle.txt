'use client'

import { useUIStore } from '@/stores/uiStore'
import { ThemeIcon } from '@/components/ui/Icons'

export function ThemeToggle() {
  const { theme, toggleTheme } = useUIStore()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label="Toggle theme"
    >
      <ThemeIcon className="w-5 h-5" />
    </button>
  )
}