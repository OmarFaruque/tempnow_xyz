import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Letterise - AI-Powered Document Generator',
  description: 'Generate professional dispute letters, insurance claims, complaints, appeals, and official documents using AI. Fast, accurate, and legally sound document generation.',
}

export default function AiDocumentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="letterise-theme min-h-screen text-foreground selection:bg-pink-500 selection:text-white">
      {children}
    </div>
  )
}
