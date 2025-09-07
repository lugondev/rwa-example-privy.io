'use client'

import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Moon, Sun } from 'lucide-react'

/**
 * Component to test theme switching functionality
 * Displays current theme and provides toggle button
 */
export function ThemeTest() {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          Theme Test
        </CardTitle>
        <CardDescription>
          Current theme: <span className="font-semibold">{theme}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-primary text-primary-foreground rounded-lg">
            <p className="text-sm font-medium">Primary</p>
            <p className="text-xs opacity-80">Primary color</p>
          </div>
          <div className="p-4 bg-secondary text-secondary-foreground rounded-lg">
            <p className="text-sm font-medium">Secondary</p>
            <p className="text-xs opacity-80">Secondary color</p>
          </div>
          <div className="p-4 bg-muted text-muted-foreground rounded-lg">
            <p className="text-sm font-medium">Muted</p>
            <p className="text-xs opacity-80">Muted color</p>
          </div>
          <div className="p-4 bg-accent text-accent-foreground rounded-lg">
            <p className="text-sm font-medium">Accent</p>
            <p className="text-xs opacity-80">Accent color</p>
          </div>
        </div>
        
        <Button 
          onClick={toggleTheme} 
          variant="outline" 
          className="w-full"
        >
          {isDark ? (
            <>
              <Sun className="h-4 w-4 mr-2" />
              Switch to Light
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 mr-2" />
              Switch to Dark
            </>
          )}
        </Button>
        
        <div className="text-sm text-muted-foreground">
          <p>Background: <span className="px-2 py-1 bg-background border rounded">bg-background</span></p>
          <p>Foreground: <span className="px-2 py-1 bg-foreground text-background rounded">text-foreground</span></p>
          <p>Border: <span className="px-2 py-1 border-2 border-border rounded">border-border</span></p>
        </div>
      </CardContent>
    </Card>
  )
}