'use client'

import { useState } from 'react'

/**
 * Simple test button to verify basic functionality
 */
export function TestButton() {
  const [clicked, setClicked] = useState(false)

  const handleClick = () => {
    setClicked(!clicked)
    console.log('Test button clicked:', !clicked)
  }

  return (
    <button
      onClick={handleClick}
      className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
        clicked
          ? 'bg-green-600 hover:bg-green-700 text-white'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      {clicked ? 'Clicked!' : 'Test Button'}
    </button>
  )
}