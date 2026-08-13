import { cn } from '@letterise/lib/utils'

const sizes = {
  sm: 'h-6 w-6 text-[11px]',
  md: 'h-9 w-9 text-sm',
  lg: 'h-14 w-14 text-xl',
  xl: 'h-20 w-20 text-3xl',
}

/**
 * Monogram badge built from the persona's first letter. Using a letter rather
 * than a static image means the mark stays correct when the AI is renamed.
 */
export function PersonaMark({
  initial,
  accent,
  size = 'md',
  className,
}: {
  initial: string
  accent: string
  size?: keyof typeof sizes
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        sizes[size],
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, ${accent} 0%, color-mix(in srgb, ${accent} 45%, #6d28d9) 100%)`,
        boxShadow: `0 0 0 1px color-mix(in srgb, ${accent} 40%, transparent), 0 8px 24px -8px ${accent}`,
      }}
    >
      {initial}
    </span>
  )
}
