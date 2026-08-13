'use client'

import * as React from 'react'
import * as LucideIcons from 'lucide-react'
import { Search, ChevronDown, Check, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * We extract all icon names from the lucide-react package.
 * We filter for keys that start with an uppercase letter (PascalCase)
 * and exclude known internal exports or types.
 */
const ALL_ICONS = Object.keys(LucideIcons)
  .filter(key => {
    return (
      /^[A-Z]/.test(key) && 
      !['LucideIcon', 'LucideProps', 'createLucideIcon', 'icons', 'default'].includes(key)
    )
  })
  .sort()

interface LucideIconPickerProps {
  value: string
  onChange: (value: string) => void
}

export function LucideIconPicker({ value, onChange }: LucideIconPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Memoized search results with partial matching
  const filteredIcons = React.useMemo(() => {
    const query = search.toLowerCase().trim()
    
    if (!query) return ALL_ICONS.slice(0, 100)

    return ALL_ICONS.filter(name => 
      name.toLowerCase().includes(query)
    ).slice(0, 100)
  }, [search])

  const SelectedIcon = (LucideIcons as any)[value] || HelpCircle

  // Close when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative w-full" ref={containerRef}>
      <div 
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-all",
          open && "ring-2 ring-ring ring-offset-2 border-primary"
        )}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2 truncate">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted/50">
            <SelectedIcon className="h-4 w-4" />
          </div>
          <span className="truncate font-medium">{value || 'Select icon...'}</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-50 transition-transform duration-200", open && "rotate-180")} />
      </div>

      {open && (
        <div className="absolute z-[100] mt-2 w-full min-w-[200px] rounded-lg border bg-popover text-popover-foreground shadow-xl outline-none animate-in fade-in zoom-in-95 slide-in-from-top-2 overflow-hidden bg-gray-900/40 backdrop-blur-sm">
          <div className="flex items-center border-b px-3 bg-muted/30">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredIcons.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <div className="mb-2 flex justify-center">
                  <Search className="h-8 w-8 opacity-20" />
                </div>
                No icons found for "{search}"
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-0.5">
                {filteredIcons.map((name) => {
                  const Icon = (LucideIcons as any)[name]
                  const isSelected = value === name
                  return (
                    <div
                      key={name}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm cursor-pointer transition-colors",
                        isSelected ? "bg-primary text-primary-foreground" : "hover:bg-accent hover:text-accent-foreground"
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onChange(name)
                        setOpen(false)
                        setSearch('')
                      }}
                    >
                      <div className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded border transition-colors",
                        isSelected ? "bg-primary-foreground/20 border-primary-foreground/30" : "bg-muted/50 border-transparent"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="flex-1 truncate font-medium">{name}</span>
                      {isSelected && <Check className="h-4 w-4 shrink-0" />}
                    </div>
                  )
                })}
              </div>
            )}
            {ALL_ICONS.filter(name => name.toLowerCase().includes(search.toLowerCase())).length > 100 && (
              <div className="py-2 text-center text-[10px] text-muted-foreground border-t mt-1 bg-muted/10">
                Type more to refine search...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
