"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Paperclip,
  Send,
  Download,
  Eye,
  X,
  Clock,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  FileText,
  ArrowLeft,
  Menu,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

// Mock ticket data for testing
const mockTicketData: { [key: string]: any } = {
  "6ghmkr8tb5g": {
    id: "TKT-001",
    subject: "Order Document Issue",
    customer: {
      name: "John Smith",
      email: "john.smith@example.com",
    },
    status: "Open",
    priority: "High",
    category: "Documents",
    createdAt: "2023-05-28T10:30:00",
    updatedAt: "2023-05-28T14:45:00",
    messages: [
      {
        id: "MSG-001",
        sender: "customer",
        content:
          "I purchased a document for my vehicle but I haven't received it yet. Can you please check on my order P-12345?",
        timestamp: "2023-05-28T10:30:00",
        read: true,
        attachments: [],
      },
      {
        id: "MSG-002",
        sender: "admin",
        content:
          "Thank you for contacting Tempify support. I can help you with that. Let me check your order status right away.",
        timestamp: "2023-05-28T11:15:00",
        read: true,
        attachments: [],
      },
      {
        id: "MSG-003",
        sender: "customer",
        content: "Thank you! I appreciate your quick response.",
        timestamp: "2023-05-28T13:20:00",
        read: true,
        attachments: [],
      },
    ],
  },
  "123": {
    id: "TKT-123",
    subject: "Question about document templates",
    customer: {
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
    },
    status: "In Progress",
    priority: "Medium",
    category: "General Inquiry",
    createdAt: "2024-01-15T09:00:00",
    updatedAt: "2024-01-15T16:30:00",
    messages: [
      {
        id: "MSG-101",
        sender: "customer",
        content:
          "Hi, I have a question about the AI-generated templates. Can these documents be used for official purposes or are they just for reference?",
        timestamp: "2024-01-15T09:00:00",
        read: true,
        attachments: [],
      },
      {
        id: "MSG-102",
        sender: "admin",
        content:
          "Hello Sarah! Thank you for reaching out. Our AI-generated templates are strictly for personal and educational use only. They are NOT official insurance documents and cannot be used for legal or official purposes. Each purchase gives you access to three different example document layouts for reference purposes.",
        timestamp: "2024-01-15T10:45:00",
        read: true,
        attachments: [],
      },
      {
        id: "MSG-103",
        sender: "customer",
        content:
          "That makes sense. Where can I find more details about the limitations and proper use of these templates?",
        timestamp: "2024-01-15T14:20:00",
        read: true,
        attachments: [],
      },
      {
        id: "MSG-104",
        sender: "admin",
        content:
          "You can find all the details in our Terms of Service page, particularly the 'Cover Note-Style Templates Disclaimer' section. It clearly outlines that Tempify is not FCA-regulated and our documents are not legally valid. If you have any other questions, feel free to ask!",
        timestamp: "2024-01-15T16:30:00",
        read: true,
        attachments: [],
      },
    ],
  },
}

export default function TempifyTicketPage({ params }: { params: { id: string } }) {
  const [ticket, setTicket] = useState<any>(null)
  const [newMessage, setNewMessage] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Load ticket data based on ID
    const ticketData = mockTicketData[params.id]
    if (ticketData) {
      setTicket(ticketData)
    }
  }, [params.id])

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [ticket?.messages])

  const handleSubmitMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Add new message to ticket
      const newMsg = {
        id: `MSG-${Date.now()}`,
        sender: "customer",
        content: newMessage,
        timestamp: new Date().toISOString(),
        read: true,
        attachments: attachments.map((file, index) => ({
          id: `ATT-${Date.now()}-${index}`,
          name: file.name,
          size: `${Math.round(file.size / 1024)} KB`,
          type: file.type,
          url: "#",
        })),
      }

      setTicket({
        ...ticket,
        messages: [...ticket.messages, newMsg],
        updatedAt: new Date().toISOString(),
      })

      setNewMessage("")
      setAttachments([])
      setSubmitSuccess(true)

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Failed to submit message:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setAttachments([...attachments, ...newFiles])
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const getStatusBadge = (status: string) => {
    const statusColor = getStatusColor(status)
    return <Badge className={statusColor}>{status}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const priorityColor = getPriorityColor(priority)
    return <Badge className={priorityColor}>{priority}</Badge>
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      case "in progress":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "resolved":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "closed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading ticket...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="bg-black/95 backdrop-blur-sm px-4 sm:px-6 py-4 sm:py-5 border-b border-orange-900/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <Link
              href="/tempify"
              className="text-2xl sm:text-3xl font-black tracking-tighter bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent hover:scale-105 transition-transform"
            >
              TEMPIFY
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden sm:flex gap-6 items-center" role="navigation">
              <Link
                href="/tempify/documents"
                className="text-gray-300 hover:text-orange-400 transition-colors font-medium text-sm"
              >
                Documents
              </Link>
              <Link
                href="/tempify/contact"
                className="text-gray-300 hover:text-orange-400 transition-colors font-medium text-sm"
              >
                Contact
              </Link>
              <Link href="/tempify/login">
                <Button className="bg-orange-600 hover:bg-orange-500 text-white font-semibold px-6 rounded-full shadow-lg shadow-orange-600/20">
                  Sign In
                </Button>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="sm:hidden p-2 text-orange-400 hover:bg-gray-900 rounded-lg transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="sm:hidden mt-6 pb-4 space-y-4" role="navigation">
              <Link href="/tempify/documents" onClick={closeMobileMenu} className="block">
                <div className="text-gray-300 hover:text-orange-400 transition-colors font-medium py-2">Documents</div>
              </Link>
              <Link href="/tempify/contact" onClick={closeMobileMenu} className="block">
                <div className="text-gray-300 hover:text-orange-400 transition-colors font-medium py-2">Contact</div>
              </Link>
              <Link href="/tempify/login" onClick={closeMobileMenu}>
                <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-full">
                  Sign In
                </Button>
              </Link>
            </nav>
          )}
        </div>
      </header>

      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-4000" />
      </div>

      <div className="relative bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center text-sm text-gray-400">
            <Link href="/tempify" className="hover:text-orange-400 transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/tempify/contact" className="hover:text-orange-400 transition-colors">
              Support
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white font-medium">Ticket {ticket.id}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-6xl mx-auto px-4 py-8">
        <div className="grid gap-8">
          {/* Back Button */}
          <div>
            <Link href="/tempify/contact">
              <Button
                variant="outline"
                className="mb-4 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Contact
              </Button>
            </Link>
          </div>

          <Card className="shadow-2xl border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-teal-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    Support Ticket #{ticket.id}
                  </CardTitle>
                  <CardDescription className="text-orange-100 mt-2 text-lg">{ticket.subject}</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-white mb-2">Customer Information</h4>
                  <div className="space-y-1 text-gray-400">
                    <p>
                      <span className="font-medium text-gray-300">Name:</span> {ticket.customer.name}
                    </p>
                    <p>
                      <span className="font-medium text-gray-300">Email:</span> {ticket.customer.email}
                    </p>
                    <p>
                      <span className="font-medium text-gray-300">Category:</span> {ticket.category}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">Ticket Details</h4>
                  <div className="space-y-1 text-gray-400">
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-400" />
                      <span className="font-medium text-gray-300">Created:</span> {formatDate(ticket.createdAt)}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-400" />
                      <span className="font-medium text-gray-300">Last Updated:</span> {formatDate(ticket.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border-gray-800 bg-gray-900/50 backdrop-blur-sm">
            <CardHeader className="border-b border-gray-800">
              <CardTitle className="flex items-center gap-2 text-xl text-white">
                <MessageSquare className="h-5 w-5 text-orange-400" />
                Conversation History
              </CardTitle>
              <CardDescription className="text-gray-400">
                You can reply to this conversation and our Tempify support team will be notified immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6 mb-8">
                {ticket.messages.map((message: any) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "admin" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 shadow-lg ${
                        message.sender === "admin"
                          ? "bg-gradient-to-br from-orange-600/20 to-teal-600/20 border border-orange-500/30"
                          : "bg-gradient-to-br from-gray-800 to-gray-800/80 border border-gray-700"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              message.sender === "admin"
                                ? "bg-gradient-to-r from-orange-500 to-teal-500 text-white"
                                : "bg-gray-700 text-white"
                            }`}
                          >
                            {message.sender === "admin"
                              ? "CS"
                              : ticket.customer.name
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                          </div>
                          <span className="font-semibold text-sm text-white">
                            {message.sender === "admin" ? "Tempify Support" : ticket.customer.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 bg-black/30 px-2 py-1 rounded-full">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap text-gray-200 leading-relaxed">{message.content}</p>

                      {/* Attachments */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            Attachments:
                          </div>
                          {message.attachments.map((attachment: any) => (
                            <div
                              key={attachment.id}
                              className="flex items-center gap-3 bg-gray-800/50 rounded-lg p-3 border border-gray-700 shadow-sm"
                            >
                              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                                <FileText className="h-4 w-4 text-orange-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{attachment.name}</p>
                                <p className="text-xs text-gray-500">{attachment.size}</p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-orange-500/20 text-orange-400"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-orange-500/20 text-orange-400"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Success Message */}
              {submitSuccess && (
                <Alert className="mb-6 bg-green-500/20 border-green-500/30 shadow-lg">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-300">
                    <strong>Message sent successfully!</strong> Our Tempify support team will respond soon.
                  </AlertDescription>
                </Alert>
              )}

              {/* Reply Form */}
              {ticket.status.toLowerCase() !== "closed" && (
                <div className="space-y-6 border-t border-gray-800 pt-8">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Send a Reply</h3>
                    <div>
                      <Label htmlFor="reply-message" className="text-sm font-medium text-gray-300">
                        Your Message
                      </Label>
                      <Textarea
                        id="reply-message"
                        placeholder="Type your message here... Our support team will be notified immediately."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="mt-2 min-h-[120px] bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:ring-orange-500 focus:border-orange-500"
                        rows={5}
                      />
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <Label className="text-sm font-medium text-gray-300">Attachments (optional)</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        Add Files
                      </Button>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
                      <span className="text-sm text-gray-500">Maximum 10MB per file</span>
                    </div>

                    {/* Attachment Preview */}
                    {attachments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 bg-gray-800/50 p-3 rounded-lg border border-gray-700"
                          >
                            <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                              <FileText className="h-4 w-4 text-orange-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                              className="h-8 w-8 p-0 hover:bg-red-500/20 text-red-400"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmitMessage}
                      disabled={(!newMessage.trim() && attachments.length === 0) || isSubmitting}
                      className="bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 px-8 py-2 text-white font-medium shadow-lg"
                      size="lg"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Sending Reply..." : "Send Reply"}
                    </Button>
                  </div>
                </div>
              )}

              {ticket.status.toLowerCase() === "closed" && (
                <Alert className="border-amber-500/30 bg-amber-500/20">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <AlertDescription className="text-amber-300">
                    <strong>This support ticket has been closed.</strong> If you need further assistance, please{" "}
                    <Link href="/tempify/contact" className="underline font-medium hover:text-amber-200">
                      submit a new support request
                    </Link>
                    .
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="bg-black border-t border-gray-900 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              TEMPIFY
            </h3>
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6">
              <Link
                href="/tempify/privacy-policy"
                className="text-gray-500 hover:text-orange-400 text-sm transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/tempify/terms-of-service"
                className="text-gray-500 hover:text-orange-400 text-sm transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/tempify/return-policy"
                className="text-gray-500 hover:text-orange-400 text-sm transition-colors"
              >
                Return Policy
              </Link>
            </div>
            <p className="text-gray-600 text-sm">&copy; 2025 Tempify. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
