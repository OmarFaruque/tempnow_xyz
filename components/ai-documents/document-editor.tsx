'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { ArrowLeft, Printer, Shield, Edit, Save, Download, Loader2, FileDown, X, Type, Bold, Italic, Palette } from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type DocumentEditorProps = {
  document: {
    id: number
    title: string
    content: string
    categoryName: string
    createdAt: string
    userInputs?: Record<string, unknown> | null
    fontPreference?: string
    textColor?: string
    fontSize?: number
    textBold?: boolean
    textItalic?: boolean
  }
}

const FONT_OPTIONS = [
  { value: 'times', label: 'Times New Roman', className: 'font-serif', pdfFont: 'times' },
  { value: 'arial', label: 'Arial', className: 'font-sans', pdfFont: 'helvetica' },
  { value: 'courier', label: 'Courier New', className: 'font-mono', pdfFont: 'courier' },
  { value: 'georgia', label: 'Georgia', className: 'font-serif', pdfFont: 'times' },
  { value: 'helvetica', label: 'Helvetica', className: 'font-sans', pdfFont: 'helvetica' },
  { value: 'palatino', label: 'Palatino', className: 'font-serif', pdfFont: 'times' },
  { value: 'garamond', label: 'Garamond', className: 'font-serif', pdfFont: 'times' },
  { value: 'verdana', label: 'Verdana', className: 'font-sans', pdfFont: 'helvetica' },
]

function formatFieldLabel(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (s) => s.toUpperCase())
}

const COLOR_PRESETS = [
  { value: '#000000', label: 'Black' },
  { value: '#1a1a1a', label: 'Dark Gray' },
  { value: '#4a4a4a', label: 'Medium Gray' },
  { value: '#0f172a', label: 'Slate' },
  { value: '#1e40af', label: 'Blue' },
  { value: '#7c3aed', label: 'Purple' },
  { value: '#059669', label: 'Green' },
  { value: '#dc2626', label: 'Red' },
]

export function DocumentEditor({ document }: DocumentEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(document.content)
  
  const [fontPreference, setFontPreference] = useState(document.fontPreference || 'times')
  const [textColor, setTextColor] = useState(document.textColor || '#000000')
  const [fontSize, setFontSize] = useState(document.fontSize || 12)
  const [textBold, setTextBold] = useState(document.textBold || false)
  const [textItalic, setTextItalic] = useState(document.textItalic || false)
  
  const [isSaving, setIsSaving] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  const contentRef = useRef<HTMLDivElement>(null)
  const savedSelectionRef = useRef<{ start: Node; startOffset: number; end: Node; endOffset: number } | null>(null)

  const selectedFont = FONT_OPTIONS.find(f => f.value === fontPreference) || FONT_OPTIONS[0]


  const isBenefitsDecisionAppeal = document.title === 'Benefits Decision Appeal'
  const isStructuredLegalTemplate = /appeal|application|claim|complaint|statement|submission|petition/i.test(
    document.title,
  )

  const formattedUserInputEntries = Object.entries(document.userInputs || {})
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => ({
      question: formatFieldLabel(key),
      answer: String(value).trim(),
    }))

  // The question/answer layout exists to make *fallback* documents readable: when
  // generation falls back, the stored content is only a label/value dump, so echoing
  // the inputs is no worse than the content itself. Once Lettie has actually written
  // the document we must show that prose instead — otherwise the generated letter is
  // invisible in both this view and the PDF export below.
  const hasGeneratedProse =
    document.content.trim().length > 0 &&
    !/Generated on:[\s\S]*Submitted Information:/.test(document.content)

  const shouldUseQuestionAnswerLayout =
    !hasGeneratedProse &&
    formattedUserInputEntries.length > 0 &&
    (isBenefitsDecisionAppeal || isStructuredLegalTemplate)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const saveSelection = () => {
    if (!isMounted || typeof window === 'undefined') return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    if (!range) return

    savedSelectionRef.current = {
      start: range.startContainer,
      startOffset: range.startOffset,
      end: range.endContainer,
      endOffset: range.endOffset,
    }
  }

  const restoreSelection = () => {
    if (!isMounted || typeof window === 'undefined' || !savedSelectionRef.current) return

    const { start, startOffset, end, endOffset } = savedSelectionRef.current

    try {
      const selection = window.getSelection()
      if (!selection) return

      const range = document.createRange()
      range.setStart(start, startOffset)
      range.setEnd(end, endOffset)
      
      selection.removeAllRanges()
      selection.addRange(range)
    } catch (error) {
      console.log('[v0] Could not restore selection:', error)
    }
  }

  const applyFormatToSelection = (formatType: 'bold' | 'italic' | 'color' | 'fontSize', value?: string | number) => {
    if (!isMounted || typeof window === 'undefined' || typeof document === 'undefined') {
      console.log('[v0] Cannot apply format - not mounted or not in browser')
      return
    }
    
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      console.log('[v0] No selection object')
      return
    }

    const range = selection.getRangeAt(0)
    if (!range || range.collapsed) {
      console.log('[v0] Empty selection')
      return
    }

    // Save the selection before making any changes
    saveSelection()

    const span = window.document.createElement('span')
    
    switch (formatType) {
      case 'bold':
        span.style.fontWeight = 'bold'
        break
      case 'italic':
        span.style.fontStyle = 'italic'
        break
      case 'color':
        if (value) span.style.color = value as string
        break
      case 'fontSize':
        if (value) span.style.fontSize = `${value}px`
        break
    }

    try {
      // Extract the contents and wrap in the span
      const contents = range.extractContents()
      span.appendChild(contents)
      range.insertNode(span)
      
      // Update the edited content
      if (contentRef.current) {
        const newContent = contentRef.current.innerHTML
        setEditedContent(newContent)
      }

      // Create a new range that selects the span we just created
      const newRange = document.createRange()
      newRange.selectNodeContents(span)
      
      // Re-select the formatted text
      selection.removeAllRanges()
      selection.addRange(newRange)
      
      // Save the new selection for future restoration
      savedSelectionRef.current = {
        start: newRange.startContainer,
        startOffset: newRange.startOffset,
        end: newRange.endContainer,
        endOffset: newRange.endOffset,
      }
    } catch (error) {
      console.error('[v0] Error applying format:', error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: editedContent,
          fontPreference,
          textColor,
          fontSize,
          textBold,
          textItalic
        })
      })

      if (!response.ok) throw new Error('Failed to save')
      
      setIsEditing(false)
    } catch (error) {
      console.error('[v0] Save error:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedContent(document.content)
    setFontPreference(document.fontPreference || 'times')
    setTextColor(document.textColor || '#000000')
    setFontSize(document.fontSize || 12)
    setTextBold(document.textBold || false)
    setTextItalic(document.textItalic || false)
    setIsEditing(false)
  }

  const handleDownloadPDF = async () => {
    if (!isMounted || typeof window === 'undefined') {
      console.log('[v0] Cannot download PDF - not mounted')
      return
    }
    
    setIsDownloading(true)
    
    try {
      const { jsPDF } = await import('jspdf')
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 25
      const maxWidth = pageWidth - (margin * 2)
      let yPosition = margin

      const selectedPDFFont = selectedFont.pdfFont
      
      const generatedDate = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })

      doc.setLineHeightFactor(1.5)

      doc.setFont(selectedPDFFont, 'bold')
      doc.setFontSize(20)
      doc.setTextColor(0, 0, 0)
      doc.text('LEGAL DOCUMENT DRAFT', margin, yPosition)
      yPosition += 10

      doc.setFont(selectedPDFFont, 'normal')
      doc.setFontSize(11)
      doc.setTextColor(110, 110, 110)
      doc.text(`Generated on: ${generatedDate}`, margin, yPosition)
      yPosition += 12
      
      doc.setFont(selectedPDFFont, 'normal')
      doc.setFontSize(fontSize)
      doc.setTextColor(0, 0, 0)
      

      const lineHeight = (fontSize * 0.5) + 2
      const ensureSpace = (neededHeight: number) => {
        if (yPosition + neededHeight > pageHeight - margin) {
          doc.addPage()
          yPosition = margin
        }
      }

      if (shouldUseQuestionAnswerLayout) {
        formattedUserInputEntries.forEach(({ question, answer }) => {
          const questionLines = doc.splitTextToSize(question, maxWidth)
          const answerLines = doc.splitTextToSize(answer, maxWidth)
          const blockHeight = (questionLines.length + answerLines.length) * lineHeight + 6

          ensureSpace(blockHeight)

          doc.setFont(selectedPDFFont, 'bold')
          questionLines.forEach((line: string) => {
            doc.text(line, margin, yPosition)
            yPosition += lineHeight
          })

          doc.setFont(selectedPDFFont, 'normal')
          answerLines.forEach((line: string) => {
            doc.text(line, margin, yPosition)
            yPosition += lineHeight
          })

          yPosition += 6
        })
      } else {
        const tempDiv = window.document.createElement('div')
        tempDiv.innerHTML = editedContent
        const textContent = tempDiv.textContent || tempDiv.innerText || editedContent
        const paragraphs = textContent.split('\n\n')

        paragraphs.forEach((paragraph, paraIndex) => {
          if (paragraph.trim() === '') return

          const lines = doc.splitTextToSize(paragraph.trim(), maxWidth)
          ensureSpace(lines.length * lineHeight + 4)

          lines.forEach((line: string) => {
            doc.text(line, margin, yPosition)
            yPosition += lineHeight
          })

          if (paraIndex < paragraphs.length - 1) {
            yPosition += 5
          }
          
         
        })
        
      }

      const filename = `${document.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
      doc.save(filename)
    } catch (error) {
      console.error('[v0] PDF generation error:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const documentStyle = {
    color: textColor,
    fontSize: `${fontSize}px`,
    fontWeight: textBold ? 'bold' : 'normal',
    fontStyle: textItalic ? 'italic' : 'normal',
  }

  const questionStyle = {
    ...documentStyle,
    fontWeight: 'bold' as const,
  }

  return (
    <main className="flex-1 bg-gradient-to-b from-muted/30 to-background">
      <section className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
         <div className="container mx-auto py-6 md:py-8 max-w-5xl">
          <Link 
            href="/dashboard" 
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mt-4">
            <div className="flex-1">
              <Badge variant="secondary" className="mb-3">
                {document.categoryName}
              </Badge>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 text-balance leading-tight">
                {document.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Created {new Date(document.createdAt).toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {!isEditing ? (
                <>
                  <Button onClick={() => setIsEditing(true)} variant="outline" className="flex-1 sm:flex-none">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button disabled={isDownloading} className="flex-1 sm:flex-none">
                        {isDownloading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleDownloadPDF}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Download as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" onClick={handlePrint} className="flex-1 sm:flex-none">
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleCancel} variant="outline" className="flex-1 sm:flex-none">
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1 sm:flex-none">
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto py-8 md:py-12 max-w-5xl">
        <Alert className="mb-8 border-primary/50 bg-primary/5">
          <Shield className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm leading-relaxed">
            This document is for informational purposes only and does not constitute legal advice. 
            Please review carefully and consult with a licensed attorney or solicitor if needed.
          </AlertDescription>
        </Alert>

        {isEditing && (
          <div className="mb-6 bg-card border-2 rounded-xl shadow-sm p-6 space-y-6">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Type className="h-4 w-4" />
              Document Formatting
            </h3>
            
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-xs text-blue-900">
                💡 Tip: Select any text in the document below, then use these formatting buttons to style just that portion.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Font Family (Global)</Label>
              <div className="flex flex-wrap gap-2">
                {FONT_OPTIONS.map((font) => (
                  <Button
                    key={font.value}
                    type="button"
                    variant={fontPreference === font.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFontPreference(font.value)}
                    className="min-w-[100px]"
                  >
                    {font.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Format Selected Text</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyFormatToSelection('bold')}
                  className="min-w-[80px]"
                >
                  <Bold className="mr-2 h-4 w-4" />
                  Bold
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyFormatToSelection('italic')}
                  className="min-w-[80px]"
                >
                  <Italic className="mr-2 h-4 w-4" />
                  Italic
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Font Size (Selected Text)</Label>
              <div className="flex flex-wrap gap-2">
                {[10, 11, 12, 14, 16, 18, 20, 24].map((size) => (
                  <Button
                    key={size}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyFormatToSelection('fontSize', size)}
                    className="min-w-[60px]"
                  >
                    {size}pt
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Text Color (Selected Text)
              </Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((color) => (
                  <Button
                    key={color.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => applyFormatToSelection('color', color.value)}
                    className="min-w-[100px] gap-2"
                  >
                    <div 
                      className="w-4 h-4 rounded border border-border" 
                      style={{ backgroundColor: color.value }}
                    />
                    {color.label}
                  </Button>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    onChange={(e) => applyFormatToSelection('color', e.target.value)}
                    className="h-9 w-16 rounded border border-input cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground">Custom</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Label className="text-sm font-medium mb-3 block">Global Document Styles</Label>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={textBold ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTextBold(!textBold)}
                    className="min-w-[80px]"
                  >
                    <Bold className="mr-2 h-4 w-4" />
                    Bold All
                  </Button>
                  <Button
                    type="button"
                    variant={textItalic ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTextItalic(!textItalic)}
                    className="min-w-[80px]"
                  >
                    <Italic className="mr-2 h-4 w-4" />
                    Italic All
                  </Button>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Global Font Size</Label>
                  <div className="flex flex-wrap gap-2">
                    {[10, 11, 12, 14, 16, 18, 20, 24].map((size) => (
                      <Button
                        key={size}
                        type="button"
                        variant={fontSize === size ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFontSize(size)}
                        className="min-w-[60px]"
                      >
                        {size}pt
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Global Text Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_PRESETS.slice(0, 4).map((color) => (
                      <Button
                        key={color.value}
                        type="button"
                        variant={textColor === color.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTextColor(color.value)}
                        className="min-w-[100px] gap-2"
                      >
                        <div 
                          className="w-4 h-4 rounded border border-border" 
                          style={{ backgroundColor: color.value }}
                        />
                        {color.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border-2 rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 md:p-12 lg:p-16">
            <h3 className="text-xl font-semibold text-slate-900 mb-8 pb-4 border-b-2 border-slate-200">
              {document.title}
            </h3>
            
            {isEditing ? (
              <div 
                ref={contentRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => {
                  setEditedContent(e.currentTarget.innerHTML)
                  restoreSelection()
                }}
                className={`min-h-[600px] outline-none focus:ring-2 focus:ring-primary rounded p-4 whitespace-pre-wrap leading-relaxed ${selectedFont.className}`}
                style={documentStyle}
                dangerouslySetInnerHTML={{ __html: editedContent }}
              />
              ) : shouldUseQuestionAnswerLayout ? (
              <div className="space-y-6">
                {formattedUserInputEntries.map(({ question, answer }) => (
                  <div key={question} className="space-y-2">
                    <p className="font-bold" style={questionStyle}>{question}</p>
                    <p className="whitespace-pre-wrap leading-relaxed" style={documentStyle}>{answer}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="prose prose-slate max-w-none">
                <div 
                  className={`whitespace-pre-wrap leading-relaxed ${selectedFont.className}`}
                  style={documentStyle}
                  dangerouslySetInnerHTML={{ __html: editedContent }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Generated by Letterise • Not Legal Advice</p>
        </div>
      </div>
    </main>
  )
}
