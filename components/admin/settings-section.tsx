"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  CreditCard,
  Key,
  Database,
  Brain,
  Mail,
  Shield,
  Eye,
  EyeOff,
  Save,
  TestTube,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileText,
  Clock,
  Info,
  DollarSign,
  Construction,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { QuoteFormulaSettings } from "./quote-formula-settings"
import { DocumentTemplatesTab } from "./document-templates-tab"
import { defaultMaintenanceSettings } from "@/lib/maintenance"
import { PaymentSettingsTab } from "./features/config/payment-config-tab"
import { AISettingsTab } from "./ai-settings-tab"
import { ResendSettingsTab } from "./resend-settings-tab"
import { GeneralSettingsTab } from "./general-settings-tab"
import { sanitizeHexColor, shadeHexColor, tintHexColor } from "@/core/helpers"

export function EmailTemplatesTab({ settings }: { settings?: any }) {
  const [templates, setTemplates] = useState({
    policyConfirmation: {
      subject: "Your Order Confirmation - {{policyNumber}}",
      header: "Order Confirmation",
      footer: "Thank you for choosing our service.",
      content: `Dear {{firstName}} {{lastName}},

Thank you for choosing Tempnow! Your order has been successfully created.

Document Details:
- Order Number: {{policyNumber}}
- Coverage Type: {{coverageType}}
- Start Date: {{startDate}}
- End Date: {{endDate}}
- Premium: £{{premium}}

Vehicle Details:
- Registration: {{vehicleReg}}
- Make & Model: {{vehicleMake}} {{vehicleModel}}
- Year: {{vehicleYear}}

You can view your order details anytime by visiting our customer portal.

If you have any questions, please don't hesitate to contact us.

Best regards,
The Tempnow Team`,
    },
    verificationCode: {
      subject: "Your Verification Code - Tempnow",
      header: "Verification Code",
      footer: "If you did not request this, please ignore this email.",
      content: `Dear {{firstName}},

Your verification code is: {{code}}

This code will expire in {{expiryMinutes}} minutes.

If you did not request this code, please ignore this email.

Best regards,
The Tempnow Team`,
    },
    passwordReset: {
      subject: "Password Reset Request - Tempnow",
      header: "Password Reset",
      footer: "If you did not request this, please ignore this email.",
      content: `Dear {{firstName}},

We received a request to reset your password for your Tempnow account.

Click the link below to reset your password:
{{resetLink}}

This link will expire in {{expiryMinutes}} minutes.

If you did not request this password reset, please ignore this email and your password will remain unchanged.

Best regards,
The Tempnow Team`,
    },
    documentPurchase: {
      subject: "Your AI Document Purchase - Tempnow",
      header: "AI Document Purchase",
      footer: "Thank you for your purchase.",
      content: `Dear {{firstName}} {{lastName}},

Thank you for purchasing an AI-generated document from Tempnow.

Order Details:
- Order ID: {{orderId}}
- Document Type: {{documentType}}
- Date: {{orderDate}}
- Amount: £{{amount}}

You can download your document using the link below:
{{downloadLink}}

This link will expire in 7 days.

If you have any questions, please don't hesitate to contact our support team.

Best regards,
The Tempnow Team`,
    },
    policyExpiry: {
      subject: "Your Order is About to Expire - {{policyNumber}}",
      header: "Order Expiry Reminder",
      footer: "Please renew to ensure continuous coverage.",
      content: `Dear {{firstName}} {{lastName}},

This is a reminder that your order {{policyNumber}} will expire in 10 minutes.

Order Details:
- Order Number: {{policyNumber}}
- Expiry Date: {{endDate}}

To ensure continuous coverage, please renew your order by clicking the link below:
{{renewalLink}}

If you have any questions, please don't hesitate to contact our support team.

Best regards,
The Tempnow Team`,
    },
    orderCancel: {
      subject: "Your Order Has Been Cancelled - {{policyNumber}}",
      header: "Order Cancellation",
      footer: "If you have any questions, contact our support team.",
      content: `Dear {{firstName}} {{lastName}},

Your order {{policyNumber}} has been cancelled by our team.

Reason for cancellation:
{{reason}}

If you believe this was a mistake, please contact support and include your order number.

Best regards,
The Tempnow Team`,
    },
    adminNotification: {
      subject: "New Purchase Notification - {{typeLabel}}",
      header: "New Purchase Notification",
      footer: "This is an automated notification.",
      content: `A new {{typeLabel}} has been purchased on Tempnow.\n\nPurchase Details:\n- Customer: {{customerName}}\n- Email: {{customerEmail}}\n- Amount: £{{amount}}\n- Type: {{typeLabel}}\n- Time: {{time}}\n- Details: {{details}}\n\nPlease review this purchase in the admin dashboard if needed.`
    },
    ticketConfirmation: {
      subject: "Support Ticket Confirmation - {{ticketId}}",
      header: "Support Ticket Received",
      footer: "We will get back to you shortly.",
      content: `Hello {{name}},\n\nThank you for contacting us. We have successfully received your support request and a ticket has been created for you.\n\nYour Ticket Details:\n- Ticket ID: {{ticketId}}\n- Status: Open\n- Next Step: Our team will review your request and get back to you shortly.\n\nYou can reference this ticket ID in any future communication with us regarding this matter. We aim to respond to all inquiries within 24 hours.\n\nBest regards,\nThe Tempnow Team`
    },
    ticketReply: {
      subject: "New Reply to Your Support Ticket - {{ticketId}}",
      header: "New Reply to Your Ticket",
      footer: "Thank you for your patience.",
      content: `Hello {{name}},\n\nA support agent has replied to your ticket with the ID: {{ticketId}}.\n\nReply:\n{{message}}\n\nPlease contact us if you have further questions. We appreciate your patience.\n\nBest regards,\nThe Tempnow Team`
    },
    directEmail: {
      subject: "{{subject}}",
      header: "",
      footer: "",
      content: `{{message}}`
    }
  })
  const [activeTemplate, setActiveTemplate] = useState("policyConfirmation")
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{
    success?: boolean
    message?: string
    timestamp?: string
  } | null>(null)

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/admin/email-templates");
      if (response.ok) {
        const data = await response.json();
        if (data.success && Object.keys(data.templates).length > 0) {
          setTemplates((prevTemplates) => ({ ...prevTemplates, ...data.templates }));
        }
      }
    } catch (error) {
      console.error("Failed to load email templates:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ templates }),
      });

      const result = await response.json();

      if (result.success) {
        setSaveStatus({
          success: true,
          message: "Email templates saved successfully",
          timestamp: new Date().toLocaleTimeString(),
        });
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      setSaveStatus({
        success: false,
        message: "Failed to save email templates",
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  // Sample data for preview
  const sampleData = {
    siteName: "Tempnow",
    companyName: "Tempnow Ltd",
    firstName: "John",
    lastName: "Smith",
    policyNumber: "POL-12345678",
    coverageType: "Comprehensive",
    startDate: "01/06/2023",
    endDate: "31/05/2024",
    premium: "499.99",
    vehicleReg: "AB12 CDE",
    vehicleMake: "Ford",
    vehicleModel: "Focus",
    vehicleYear: "2020",
    code: "123456",
    expiryMinutes: "15",
    resetLink: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=abc123`,
    orderId: "ORD-87654321",
    documentType: "Legal Document",
    orderDate: "15/05/2023",
    amount: "29.99",
    downloadLink: `${process.env.NEXT_PUBLIC_BASE_URL}/documents/download/12345`,
    renewalLink: `${process.env.NEXT_PUBLIC_BASE_URL}`,
    reason: "The order was cancelled per your request.",
  }

  const replaceVariables = (text: string) => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      if (variable === 'viewDocument') {
        return `${process.env.NEXT_PUBLIC_BASE_URL}/policy/view?number=${sampleData.policyNumber}`;
      }
      return sampleData[variable as keyof typeof sampleData] || match
    })
  }

  // Branding used by the live preview — mirrors lib/email-theme.ts on the server.
  const brandColor = sanitizeHexColor(settings?.general?.brandColor || settings?.general?.primaryColor, "#0d9488")
  const brandColorDark = shadeHexColor(brandColor, 0.22)
  const brandColorSoft = tintHexColor(brandColor, 0.92)
  const brandLogo = settings?.general?.logo || ""
  const brandSiteName = settings?.general?.siteName || "Tempnow"
  const brandCompany = settings?.general?.companyName || brandSiteName
  const brandSupport = settings?.general?.supportEmail || ""

  // Render the template content the way the new email shell would present it.
  const buildPreviewContent = () => {
    const template = templates[activeTemplate as keyof typeof templates]
    const cta = (label: string) =>
      `<div style="text-align:center; margin:20px 0;"><span style="display:inline-block; background-color:${brandColor}; background-image:linear-gradient(135deg, ${brandColor} 0%, ${brandColorDark} 100%); color:#ffffff; padding:12px 26px; border-radius:12px; font-weight:600; font-size:14px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">${label}</span></div>`
    const codeBox = (code: string) =>
      `<div style="text-align:center; margin:20px 0;"><span style="display:inline-block; background-color:${brandColorSoft}; border:1px solid ${tintHexColor(brandColor, 0.65)}; color:${shadeHexColor(brandColor, 0.35)}; border-radius:14px; padding:14px 30px; font-family:'Courier New', Courier, monospace; font-size:24px; font-weight:700; letter-spacing:6px;">${code}</span></div>`
    const messageCard = (text: string) =>
      `<div style="background-color:${brandColorSoft}; border-left:4px solid ${brandColor}; border-radius:0 12px 12px 0; padding:14px 18px; margin:16px 0; font-size:14px; line-height:1.7; color:#334155;">${text}</div>`

    let html = replaceVariables(template.content)
    // Rich blocks for placeholders the server replaces with branded components
    if (/\{\{\s*code\s*\}\}/.test(template.content)) html = html.replace(sampleData.code, codeBox(sampleData.code))
    if (/\{\{\s*message\s*\}\}/.test(template.content)) html = html.replace(/\{\{\s*message\s*\}\}/g, messageCard("Sample reply message from the support team."))
    html = html.replace(/\{\{\s*(downloadLink|viewDocument|policyDocumentLink|renewalLink|ticketUrl|resetLink)\s*\}\}/g, cta("Open Link"))
    // Links that were resolved to real URLs by the variable replacement
    html = html.replace(sampleData.downloadLink, cta("Download Document"))
    html = html.replace(`${process.env.NEXT_PUBLIC_BASE_URL}/policy/view?number=${sampleData.policyNumber}`, cta("View Document"))
    html = html.replace(sampleData.renewalLink, cta("Get a New Order"))
    html = html.replace(sampleData.resetLink, cta("Reset Password"))
    return html.replace(/\n/g, "<br>")
  }

  const insertVariable = (variable: string) => {
    const templateType = activeTemplate as keyof typeof templates
    const currentContent = templates[templateType].content
    const textarea = document.getElementById("email-content") as HTMLTextAreaElement

    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = currentContent.substring(0, start) + `{{${variable}}}` + currentContent.substring(end)

      setTemplates({
        ...templates,
        [activeTemplate]: {
          ...templates[templateType as keyof typeof templates],
          content: newContent,
        },
      })

      setTimeout(() => {
        textarea.focus()
        textarea.selectionStart = start + variable.length + 4
        textarea.selectionEnd = start + variable.length + 4
      }, 0)
    }
  }

  const getAvailableVariables = () => {
    switch (activeTemplate) {
      case "policyConfirmation":
        return [
          "siteName",
          "companyName",
          "firstName",
          "lastName",
          "policyNumber",
          "coverageType",
          "startDate",
          "endDate",
          "premium",
          "vehicleReg",
          "vehicleMake",
          "vehicleModel",
          "vehicleYear",
          "viewDocument"
        ]
      case "verificationCode":
        return ["siteName", "companyName", "firstName", "code", "expiryMinutes"]
      case "passwordReset":
        return ["siteName", "companyName", "firstName", "resetLink", "expiryMinutes"]
      case "documentPurchase":
        return ["siteName", "companyName", "firstName", "lastName", "orderId", "documentType", "orderDate", "amount", "downloadLink"]
      case "policyExpiry":
        return ["siteName", "companyName", "firstName", "lastName", "policyNumber", "endDate", "renewalLink"]
      case "orderCancel":
        return ["siteName", "companyName", "firstName", "lastName", "policyNumber", "reason"]
      case "adminNotification":
        return ["siteName", "companyName", "typeLabel", "customerName", "customerEmail", "amount", "time", "details"]
      case "ticketConfirmation":
        return ["siteName", "companyName", "name", "ticketId"]
      case "ticketReply":
        return ["siteName", "companyName", "name", "ticketId", "message", "ticketUrl"]
      case "directEmail":
        return ["siteName", "companyName", "subject", "message"]
      default:
        return ["siteName", "companyName"]
    }
  }

  const getTemplateIcon = (templateKey: string) => {
    switch (templateKey) {
      case "policyConfirmation":
        return <CheckCircle className="h-4 w-4" />
      case "verificationCode":
        return <Shield className="h-4 w-4" />
      case "passwordReset":
        return <Key className="h-4 w-4" />
      case "documentPurchase":
        return <CreditCard className="h-4 w-4" />
      case "policyExpiry":
        return <Clock className="h-4 w-4" />
      case "orderCancel":
        return <AlertTriangle className="h-4 w-4" />
      case "adminNotification":
        return <AlertTriangle className="h-4 w-4" />
      case "ticketConfirmation":
        return <CheckCircle className="h-4 w-4" />
      case "ticketReply":
        return <Mail className="h-4 w-4" />
      case "directEmail":
        return <Mail className="h-4 w-4" />
      default:
        return <Mail className="h-4 w-4" />
    }
  }

  const getTemplateTitle = (templateKey: string) => {
    switch (templateKey) {
      case "policyConfirmation":
        return "Order Confirmation"
      case "verificationCode":
        return "Verification Code"
      case "passwordReset":
        return "Password Reset"
      case "documentPurchase":
        return "Document Purchase"
      case "policyExpiry":
        return "Order Expiry"
      case "orderCancel":
        return "Order Cancel"
      case "adminNotification":
        return "Admin Notification"
      case "ticketConfirmation":
        return "Ticket Confirmation"
      case "ticketReply":
        return "Ticket Reply"
      case "directEmail":
        return "Direct Email"
      default:
        return templateKey
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Email Templates
        </CardTitle>
        <CardDescription>Customize email templates sent to customers for various events</CardDescription>
      </CardHeader>
      <CardContent>
        {saveStatus && (
          <div
            className={`mb-4 bg-${saveStatus.success ? "green" : "red"}-50 border border-${saveStatus.success ? "green" : "red"}-200 rounded-lg p-4`}
          >
            <div className="flex items-center space-x-2">
              {saveStatus.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <span className={`${saveStatus.success ? "text-green-800" : "text-red-800"} font-medium`}>
                {saveStatus.message}
              </span>
              {saveStatus.timestamp && (
                <span className={`${saveStatus.success ? "text-green-600" : "text-red-600"} text-sm`}>
                  ({saveStatus.timestamp})
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template List */}
          <div className="space-y-4">
            <h3 className="font-semibold">Templates</h3>
            <div className="space-y-2">
              {Object.keys(templates).map((templateKey) => (
                <Card
                  key={templateKey}
                  className={`cursor-pointer transition-colors ${activeTemplate === templateKey ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  onClick={() => setActiveTemplate(templateKey)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {getTemplateIcon(templateKey)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{getTemplateTitle(templateKey)}</h4>
                        <p className="text-xs text-gray-500 truncate">
                          {templateKey === "policyConfirmation" && "Sent when a new order is created"}
                          {templateKey === "verificationCode" && "Sent when user requests verification"}
                          {templateKey === "passwordReset" && "Sent when user requests password reset"}
                          {templateKey === "documentPurchase" && "Sent after AI document purchase"}
                          {templateKey === "policyExpiry" && "Sent 10 minutes before order expires"}
                          {templateKey === "orderCancel" && "Sent when an admin cancels/deletes an order"}
                          {templateKey === "adminNotification" && "Sent to admin on new purchase"}
                          {templateKey === "ticketConfirmation" && "Sent to user on new ticket"}
                          {templateKey === "ticketReply" && "Sent to user on ticket reply"}
                          {templateKey === "directEmail" && "Used for sending direct emails"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Template Editor */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Edit Template: {getTemplateTitle(activeTemplate)}</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                  <Eye className="h-4 w-4 mr-2" />
                  {showPreview ? "Edit" : "Preview"}
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>

            {!showPreview ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject Line</Label>
                  <Input
                    id="subject"
                    value={templates[activeTemplate as keyof typeof templates].subject}
                    onChange={(e) =>
                      setTemplates({
                        ...templates,
                        [activeTemplate]: {
                          ...templates[activeTemplate as keyof typeof templates],
                          subject: e.target.value,
                        },
                      })
                    }
                    placeholder="Email subject..."
                  />
                </div>

                <div>
                  <Label htmlFor="header">Header Text</Label>
                  <Textarea
                    id="header"
                    value={templates[activeTemplate as keyof typeof templates].header}
                    onChange={(e) =>
                      setTemplates({
                        ...templates,
                        [activeTemplate]: {
                          ...templates[activeTemplate as keyof typeof templates],
                          header: e.target.value,
                        },
                      })
                    }
                    placeholder="Email header text..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="footer">Footer Text</Label>
                  <Textarea
                    id="footer"
                    value={templates[activeTemplate as keyof typeof templates].footer}
                    onChange={(e) =>
                      setTemplates({
                        ...templates,
                        [activeTemplate]: {
                          ...templates[activeTemplate as keyof typeof templates],
                          footer: e.target.value,
                        },
                      })
                    }
                    placeholder="Email footer text..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="email-content">Email Content</Label>
                  <Textarea
                    id="email-content"
                    value={templates[activeTemplate as keyof typeof templates].content}
                    onChange={(e) =>
                      setTemplates({
                        ...templates,
                        [activeTemplate]: {
                          ...templates[activeTemplate as keyof typeof templates],
                          content: e.target.value,
                        },
                      })
                    }
                    placeholder="Email content..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                <div>
                  <Label>Available Variables</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getAvailableVariables().map((variable) => (
                      <Badge
                        key={variable}
                        variant="outline"
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => insertVariable(variable)}
                      >
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Click on a variable to insert it at your cursor position</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Preview Subject</Label>
                  <div className="p-3 bg-gray-50 rounded-md border">
                    <p className="font-medium">
                      {replaceVariables(templates[activeTemplate as keyof typeof templates].subject)}
                    </p>
                  </div>
                </div>

                <div>
                  <Label>Live Preview</Label>
                  <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    {/* Email header */}
                    <div
                      className="px-6 py-6"
                      style={{
                        backgroundColor: brandColor,
                        backgroundImage: `radial-gradient(120% 170% at 100% 0%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 52%), linear-gradient(135deg, ${brandColor} 0%, ${brandColorDark} 100%)`,
                      }}
                    >
                      {brandLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={brandLogo} alt={brandSiteName} className="h-8 w-auto max-w-[140px] object-contain" />
                      ) : (
                        <div className="text-white font-bold tracking-[0.16em] uppercase text-lg">
                          {brandSiteName}
                        </div>
                      )}
                      {activeTemplate !== "directEmail" && (templates[activeTemplate as keyof typeof templates].header || templates[activeTemplate as keyof typeof templates].subject) && (
                        <div className="text-white text-2xl font-bold mt-4">
                          {replaceVariables(templates[activeTemplate as keyof typeof templates].header || templates[activeTemplate as keyof typeof templates].subject)}
                        </div>
                      )}
                    </div>
                    {/* Email body */}
                    <div className="bg-white px-6 py-6">
                      <style>{`
                        .email-preview p { color:#334155; font-size:15px; line-height:1.75; margin:0 0 16px; }
                        .email-preview p:last-child { margin-bottom:0; }
                        .email-preview a { color:${brandColor}; text-decoration:underline; }
                        .email-preview strong { color:#0f172a; }
                        .email-preview ul { margin:0 0 18px; padding-left:22px; list-style:disc; }
                        .email-preview li { color:#334155; font-size:15px; line-height:1.7; margin-bottom:8px; }
                        .email-preview li::marker { color:${brandColor}; }
                      `}</style>
                      {activeTemplate === "directEmail" && (templates[activeTemplate as keyof typeof templates].header || templates[activeTemplate as keyof typeof templates].subject) && (
                        <h2 className="text-[22px] font-bold text-slate-900 mb-4">
                          {replaceVariables(templates[activeTemplate as keyof typeof templates].header || templates[activeTemplate as keyof typeof templates].subject)}
                        </h2>
                      )}
                      <div
                        className="email-preview"
                        dangerouslySetInnerHTML={{ __html: buildPreviewContent() }}
                      />
                    </div>
                    {/* Email footer */}
                    <div className="bg-slate-900 px-6 py-6">
                      <div className="text-white font-bold tracking-[0.16em] uppercase text-xs">
                        {brandSiteName}
                      </div>
                      <div className="mt-2 text-[13px] leading-7 text-slate-400">
                        {brandCompany}
                        {brandSupport ? ` · Support: ${brandSupport}` : ""}
                      </div>
                      {templates[activeTemplate as keyof typeof templates].footer && (
                        <div
                          className="mt-4 pt-4 border-t border-white/10 text-slate-300 text-xs leading-6"
                          dangerouslySetInnerHTML={{
                            __html: replaceVariables(templates[activeTemplate as keyof typeof templates].footer).replace(/\n/g, "<br>"),
                          }}
                        />
                      )}
                      <div className="mt-3 text-slate-500 text-xs">
                        © {new Date().getFullYear()} {brandCompany}. All rights reserved.
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Preview uses your site&apos;s brand color, logo and name from the General tab — each site renders its own unique design.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function SettingsSection() {
  const [settings, setSettings] = useState<any>({
    payment: {
      activeProcessor: "mollie", // Changed from "paddle" to "mollie"
      paymentDisabledMessage: "",
    },
    lemonsqueezy: {
      apiKey: "",
      storeId: "",
      variantId: "",
      webhookSecret: "",
    },
    paddle: {
      vendorId: "",
      apiKey: "",
      clientToken: "",
      webhookKey: "",
      discordRefundWebhookUrl: "",
      environment: "production",
    },
    stripe: {
      publishableKey: "",
      environment: "production",
    },
    mollie: {
      apiKey: "test_JdvHNhyqCRGaPFhGfj8FRANGbP6UUk", // Added the test API key
      webhookSecret: "",
      environment: "test", // Changed to "test" since we're using test API key
    },
    viva: {
      merchantId: "",
      apiKey: "",
      sourceCode: "",
      env: "demo",
    },
    square: {
      appId: "",
      appLocationId: "",
      accessToken: "",
      environment: "sandbox",
      paymentMethods: {
        card: true,
        googlePay: false,
        applePay: false,
      },
    },
    paypal: {
      environment: "sandbox",
      sandboxClientId: "",
      sandboxSecret: "",
      liveClientId: "",
      liveSecret: "",
    },
    checkoutcom: {
      environment: "sandbox",
      sandboxPublicKey: "",
      sandboxSecretKey: "",
      livePublicKey: "",
      liveSecretKey: "",
    },
    authorizenet: {
      environment: "sandbox",
      sandboxApiLoginId: "",
      sandboxTransactionKey: "",
      sandboxClientKey: "",
      liveApiLoginId: "",
      liveTransactionKey: "",
      liveClientKey: "",
    },
    openai: {
      apiKey: "",
      model: "gpt-4",
      minPrice: 10,
      maxPrice: 50,
      temperature: 0.7,
    },
    resend: {
      apiKey: "",
      domain: "monzic.co.uk",
      fromEmail: "noreply@monzic.co.uk",
    },
    vehicleApi: {
      apiKey: "",
      provider: "dvla",
      endpoint: "https://api.vehicledata.com",
    },
    security: {
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      requireTwoFactor: false,
      allowedDomains: ["monzic.co.uk"],
    },
    general: {
      activeJurisdiction: "uk",
      logo: "",
      brandColor: "#0d9488",
      siteName: "MONZIC",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      seoCanonicalUrl: "",
      seoImage: "",
      seoIndex: true,
      seoFollow: true,
      supportEmail: "support@tempnow.uk",
      adminEmail: "admin@tempnow.uk",
      timezone: "Europe/London",
      currency: "GBP",
      policyScheduleVisible: true,
      productInformationVisible: false,
      statementOfFactVisible: false,
      carSearchApiProvider: "dayinsure",
      siteDomain: "",
      companyName: "",
      companyRegistration: "",
      effectiveDate: "",
      aliases: "",
      businessActivity: "",
      redirectUrl: "",
      useSpecificRedirectPath: false,
      activeRedirection: "0",
      checkoutCheckboxContent: "",
      favicon: "",
      aiName: "Lettie",
      aiSlug: "ai-documents",
      popupEnabled: false,
      popupTitle: "Announcement",
      popupMessage: "",
    },
    general_uae: {
      logo: "",
      siteName: "MONZIC UAE",
      supportEmail: "support@tempnow.ae",
      adminEmail: "admin@tempnow.ae",
      timezone: "Asia/Dubai",
      currency: "AED",
      policyScheduleVisible: true,
      productInformationVisible: false,
      statementOfFactVisible: false,
      carSearchApiProvider: "dayinsure",
      siteDomain: "",
      companyName: "",
      companyRegistration: "",
      effectiveDate: "",
      aliases: "",
      businessActivity: "",
      redirectUrl: "",
      useSpecificRedirectPath: false,
      activeRedirection: "0",
      checkoutCheckboxContent: "",
      favicon: "",
    },
    maintenance: {
      ...defaultMaintenanceSettings,
    },
    motApi: {
      mot_api_key: "",
      check_car_details_api_key: "",
      mot_client_id: "",
      mot_client_secret: "",
      mot_scope_url: "",
      mot_token_url: "",
    },
    bank: {
      show: false,
      name: "",
      sortCode: "",
      accountNumber: "",
      reference: "Use your quote ID as the payment reference.",
      info: "Your payment will be processed within 2 business days.",
      discountPercentage: 0,
    },
    airwallex: {
      client_id: "",
      apikey: "",
      webhookSecret: "",
      environment: "test",
    },
    fraudLabsPro: {
      enabled: false,
      apiKey: "",
      minAmount: "0",
      action: "block",
      failOpen: true,
    },
    quoteFormula: {
      baseHourlyRate: 15,
      baseDailyRate: 50,
      multiDayDiscountPercentage: 10,
      multiWeekDiscountPercentage: 20,
      ageDiscounts: [
        { age: 17, discount: 0 },
        { age: 25, discount: 10 },
        { age: 30, discount: 15 },
      ],
      licenseHeldDiscounts: [
        { months: 6, discount: 0 },
        { months: 12, discount: 5 },
        { months: 24, discount: 10 },
      ],
    },
    certificateTemplate: {
      page1: `<div class="text-xs flex justify-between items-start">
  <div class="space-y-1">
    <div><span class="font-bold">Our Ref:</span> {{docNumber}}</div>
    <div class="font-bold">Registration Mark: {{registrationMark}}</div>
  </div>
  <div class="text-right">
    <div class="uppercase tracking-wider text-gray-600 text-[9px]">Certificate Number</div>
    <div class="font-bold">{{docNumber}}</div>
  </div>
</div>
<div class="space-y-1 text-[9px] leading-tight mt-2">
  <div class="flex gap-2"><span class="font-bold">1. DESCRIPTION OF VEHICLES:</span> <span>{{descriptionOfVehicles}}</span></div>
  <div class="flex gap-2"><span class="font-bold">2. NAME OF POLICYHOLDER</span> <span>{{name}}</span></div>
  <div>
    <div class="font-bold">3. EFFECTIVE DATE OF THE COMMENCEMENT OF</div>
    <div class="font-bold">COVERNOTE FOR THE PURPOSES OF THE RELEVANT LAW</div>
    <div>{{effectiveDate}}</div>
  </div>
  <div>
    <div class="font-bold">4. DATE OF EXPIRY OF COVERNOTE</div>
    <div>{{expiryDate}}</div>
  </div>
  <div>
    <div class="font-bold">5. PERSONS OR CLASSES OF PERSONS ENTITLED TO DRIVE</div>
    <div>{{name}} <span class="font-bold">DOB:</span> {{dob}} <span class="font-bold">Licence:</span> {{license}}</div>
  </div>
  <div>
    <div class="font-bold">6. LIMITATIONS AS TO USE SUBJECT TO THE EXCLUSIONS BELOW AND THE ADDITIONAL EXCLUSION OF USE IN ANY COMPETITION, TRIAL, PERFORMANCE TEST, RACE OR TRIAL OF SPEED, INCLUDING OFF-ROAD EVENTS, WHETHER BETWEEN MOTOR VEHICLES OR OTHERWISE, AND IRRESPECTIVE OF WHETHER THIS TAKES PLACE ON ANY CIRCUIT OR TRACK, FORMED OR OTHERWISE, AND REGARDLESS OF ANY STATUTORY AUTHORISATION OF ANY SUCH EVENTS.</div>
    <div class="mt-1 pl-2 space-y-0.5">
      <div>(a) Use for social, domestic or pleasure purposes.</div>
      <div>(b) Use by the Policyholder in connection with the business of the Policyholder.</div>
      <div>(c) Use for towing any vehicle (mechanically propelled or otherwise)</div>
    </div>
  </div>
  <div>
    <div class="font-bold">EXCLUSIONS</div>
    <div class="mt-1 pl-2 space-y-0.5">
      <div>(a) The carriage of passengers for hire or reward.</div>
      <div>(b) The carriage of goods for hire or reward.</div>
    </div>
  </div>
  <div class="mt-2">
    <div class="font-bold">IMPOUNDED VEHICLES:</div>
    <div>This Short Term Covernote certificate cannot be used for the purpose of recovering an impounded vehicle.</div>
  </div>
</div>`,
      page2: `<div class="flex justify-between items-start pb-3 border-b border-gray-200">
  <div>
    <div class="font-bold">Our Ref: {{docNumber}}</div>
  </div>
</div>
<table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
  <tr>
    <td style="width: 50%; vertical-align: top; padding-right: 12px;">
      <div style="font-size: 12px; margin-bottom: 4px;">Your order starts on</div>
      <div style="font-weight: bold; font-size: 12px;">{{effectiveDate}}</div>
    </td>
    <td style="width: 50%; vertical-align: top; padding-left: 12px;">
      <div style="font-size: 12px; margin-bottom: 4px;">Your order expires on</div>
      <div style="font-weight: bold; font-size: 12px;">{{expiryDate}}</div>
    </td>
  </tr>
</table>
<table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
  <tr>
    <td style="width: 50%; vertical-align: top; padding-right: 12px;">
      <div style="font-size: 12px; margin-bottom: 4px;">Agent</div>
      <div style="font-weight: bold; font-size: 12px;">motor covernote limited.</div>
      <div style="font-size: 10px; color: #4B5563; margin-top: 4px;">Registered in Scotland Number 2169</div>
      <div style="font-size: 10px; color: #4B5563;">Registed office:</div>
      <div style="font-size: 10px; color: #4B5563;">Travellers lane office</div>
      <div style="font-size: 10px; color: #4B5563;">Hatfield, England</div>
      <div style="font-size: 10px; color: #4B5563;">AL10 8SF</div>
    </td>
    <td style="width: 50%; vertical-align: top; padding-left: 12px;">
      <div style="margin-bottom: 12px;">
        <div style="font-size: 12px; margin-bottom: 4px;">Type of order</div>
        <div style="font-weight: bold; font-size: 12px;">Short Term Covernote</div>
      </div>
      <div>
        <div style="font-size: 12px; margin-bottom: 4px;">Order Number</div>
        <div style="font-weight: bold; font-size: 12px;">{{docNumber}}</div>
      </div>
    </td>
  </tr>
</table>
<div style="margin-top: 24px; padding-top: 16px; border-top: 2px solid #D1D5DB;">
  <h2 style="font-size: 1.125rem; font-weight: bold; margin-bottom: 4px;">Your Schedule</h2>
  <div style="font-size: 10px; color: #4B5563; margin-bottom: 8px;">Produced on: {{effectiveDate}}</div>
  <div style="font-size: 12px; font-style: italic; color: #374151; margin-bottom: 8px;">This schedule forms part of your policy</div>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
    <tr>
      <td style="width: 50%; vertical-align: top; padding-right: 8px;">
        <div style="margin-bottom: 8px;">
          <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">The Document Holder</div>
          <div style="font-size: 12px;">{{name}}</div>
        </div>
        <div style="margin-bottom: 8px;">
          <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">Address</div>
          <div style="font-size: 12px;">{{address}}</div>
        </div>
        <div>
          <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">Premium</div>
          <div style="font-size: 12px;">£{{premium}}</div>
        </div>
      </td>
      <td style="width: 50%; vertical-align: top; padding-left: 8px;">
        <div style="margin-bottom: 8px;">
          <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">Your car</div>
          <div style="font-size: 12px;">
            <div style="margin-bottom: 4px;"><span style="font-weight: 600;">Make</span> {{make}}</div>
            <div style="margin-bottom: 4px;"><span style="font-weight: 600;">Registration Mark</span> {{registrationMark}}</div>
            <div><span style="font-weight: 600;">Model</span> {{model}}</div>
          </div>
        </div>
        <div>
          <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">Excess</div>
          <div style="font-size: 12px;">£{{excess}}</div>
        </div>
      </td>
    </tr>
  </table>
  <div style="margin-top: 8px;">
    <div style="margin-bottom: 8px;">
      <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">Persons entitled to drive</div>
      <div style="font-size: 12px;">{{name}} <span style="font-weight: 600;">DOB:</span> {{dob}} <span style="font-weight: 600;">Licence:</span> {{license}}</div>
    </div>
    <div>
      <div style="font-weight: bold; font-size: 12px; margin-bottom: 4px;">Limitations as to use</div>
      <div style="font-size: 12px; line-height: 1.625;">Use for social, domestic and pleasure purposes and business use by the Policyholder excluding the carriage of passengers or goods for hire or reward.</div>
    </div>
  </div>
  <div style="margin-top: 8px; padding: 8px; background-color: #F9FAFB; border: 1px solid #D1D5DB; border-radius: 0.25rem; font-size: 10px; line-height: 1.625;">
    <p style="font-weight: bold; margin-bottom: 8px;">If the information in this Schedule is incorrect or does not meet your requirements, please tell us at once.</p>
    <p>You are reminded of the need to notify any facts that we would take into account in our assessment or acceptance of this covernote. Failure to disclose all relevant facts may invalidate your order, or result in your order not operating fully. You should keep a written record of any information you give to us.</p>
  </div>
</div>`,
      page1_footer: `<div class="mt-3 space-y-1.5 text-[10px] leading-snug">
        <p>
          I hereby certify that the Policy to which this Certificate relates satisfies the requirements of the
          relevant Law applicable in Great Britain, Northern Ireland, the Isle of Man, the Island of Guernsey, the
          Island of Jersey and the Island of Alderney.
        </p>
        <div class="font-bold text-xs" style="color: #0a0a0a">
          motor covernote limited
        </div>
        <div class="space-y-2 text-xs">
          <p>
            <span class="font-bold">NOTE:</span> For full details of the covernote cover reference should be
            made to the document.
          </p>
          <p>
            <span class="font-bold">ADVICE TO THIRD PARTIES:</span> Nothing contained in this Certificate
            affects your right as a Third Party to make a claim.
          </p>
          <p>
            Any query relating to this covernote or any alteration should be referred to the Agent through whom
            the Covernote is arranged or the motor cover limited Office - address obtainable from the order.
          </p>
          <p>The number under the heading 'CERTIFICATE NUMBER' should be quoted in all correspondence.</p>
          <p>
            <span class="font-bold">TRANSFER OF INTEREST</span> This certificate is not transferable.
          </p>
          <p>
            <span class="font-bold">TERMINATION:</span> If for any reason the Covernote is terminated during
            its currency, the Certificate must be returned.
          </p>
          <p>Failure to comply with this obligation is an offence under the Road Traffic Acts.</p>
          <p class="font-bold">
            THIS CERTIFICATE HAS BEEN PRODUCED ON A COMPUTER PRINTER AND IS NOT VALID IF ALTERED IN ANY WAY.
          </p>
        </div>
        <div class="mt-4 text-xs">
          <div class="font-bold">motor covernote limited</div>
          <div>Registered in Scotland Number 2169</div>
          <div>Registed office:</div>
          <div>Travellers lane office</div>
          <div>Hatfield, England</div>
          <div>AL10 8SF</div>
        </div>
      </div>`,
    },
    statementOfFactTemplate: {
      classOfUse: `Use for social domestic and pleasure purposes and use in person by the Policyholder in connection with their business or profession EXCLUDING use for hire or reward, racing, pacemaking, speed testing, commercial travelling or use for any purpose in connection with the motor trade.`,
      proposerDeclaration: `
    <div style="font-size:15pt; font-weight:bold">PROPOSER DECLARATION</div>
    <table class="tb1" style="padding-top:10px;"><tr><td class="td2">I declare that I:</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Have no more than 2 motoring convictions and/or 6 penalty points in the last 3 years, and have no prosecution or police enquiry pending, other than a No Covernote conviction resulting from the current seizure of the vehicle.</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Have NOT been disqualified from driving in the last 5 years.</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Have no criminal convictions.</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Have no more than 1 fault claim within the last 3 years (a pending or non-recoverable claim is considered a fault claims).</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Have <span class="bd ud">NOT</span> had a policy of covernote voided or cancelled by a covernote company</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Am a permanent UK resident for at least 36 month</td></tr></table>
    <table class="tb1"><tr><td class="td2">I declare that the vehicle:</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Will only be used for social, domestic and pleasure purposes.</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Is owned by me and I can prove legal title to the vehicle.</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Will NOT be used for commuting, business use, hire or reward, racing, pace-making, speed testing, commercial travelling or use for any purpose in relation to the motor trade.</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Will not be used to carry hazardous goods or be driven at a hazardous location.</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Has not been modified and has no more than 8 seats in total and is right-hand drive only.</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Is registered in Great Britain, Northern Ireland or the Isle of Man.</td></tr></table>
    <table class="tb2"><tr><td class="td1"></td><td class="td3">Will be in the UK at the start of the policy and will not be exported from the UK during the duration of the policy.</td></tr></table>
    <table class="tb1"><tr><td class="td2">I am aware that this covernote cannot be used for any vehicle not owned by me including Hire or Loan Vehicles (i.e. Vehicle Rentals, Vehicle Salvage/Recovery Agents, Credit Hire Vehicles/Companies and Accident Management Companies).</td></tr></table>
    <table class="tb1"><tr><td class="td2">I agree that in the event of a claim I will provide the V5 registration document, a current MOT certificate (where one is required by law to be issued) and a copy of my driving licence</td></tr></table>
  `,
      importantNotice: `
    <div style="font-size:12pt; font-weight:bold">IMPORTANT NOTICE</div>
    <table class="tb3" style="padding-top:5px;"><tr><td class="td1">information relating to your policy will be added to the Motor Covernote Database ('M information relating to your policy will be added to the added to the Motor Covernote Database ('M information relating to your policy will be added to the MID') managed by the Motor Covernote Bureau ('MIB'). MID and the data stored on it may be used by certain statutory and/or authorised bodies including the Police, the DVLA, the DVLANI, the Covernote Fraud Bureau and other bodies permitted by law for purposes not limited to but including: <br>•Electronic Licensing. <br>•Continuous Covernote Enforcement. <br>Law enforcement (prevention, detection, apprehension and or prosecution of offenders) <br>•The provision of government services and or other services aimed at reducing the level and incidence of uninsured driving. <br>If you are involved in a road traffic accident (either in the UK, EEA or certain other territories), covernotes and or the MIB may search the MID to obtain relevant information. Persons (including his or her appointed representatives) pursuing a claim in respect of a road traffic accident (including citizens of other countries) may also obtain information which is held on the MID. It is vital that the MID holds your correct registration number. If it is incorrectly shown on MID you are at risk of having your vehicle seized by the Police. Covernote Act 2015 Governs covernote contracts, including temporary documents like cover notes. It does not restrict the creation of drafts or templates — the key legal obligation is that: <br/> "The covernoter must be provided with fair and accurate presentation of the risk." <br>This means <br/>Users generating a draft cover note for reference or temporary use are not in breach of the Act unless they lie or misrepresent the covernote situation. Cuverly is not a regulated covernote provider and is not authorised by the Financial Conduct Authority (FCA). The docu... 
    </td></tr></table>
  `,
      noSignNotice: `
    <table style="width:100%; margin-top: 10px;"><tr><td>
      <div style="background-color:#000; color:#FFF; font-size:10pt; text-align:center; font-weight:bold; padding: 5px;">IMPORTANT<br>There is no need to sign this document, as by agreeing to the declaration during the quotation process you have confirmed that you have read and agree to the motor covernote limited / Proposer's Declaration</div>
    </td></tr></table>
  `,
    },
    policyScheduleTemplate: {
      endorsementsApplicable: `<table class="tb1">
        <tr><td class="bd tdl">ENDORSEMENTS APPLICABLE (Full wordings shown within ENDORSEMENTS)</td></tr>
        <tr><td class="tdl">FCC - FULLY COMPREHENSIVE</td></tr>
      </table>`,
      endorsements: `<table class="tb1">
        <tr><td class="bd tdl">ENDORSEMENTS - only apply if noted in the ENDORSEMENTS APPLICABLE above</td></tr>
      </table>
      <div style="padding:1px 0;"></div>
      <table class="tb1">
        <tr><td class="bd tdl">FCC - FULLY COMPREHENSIVE COVER</td></tr>
        <tr><td>This Short Term Docs is for Fully Comprehensive cover. There is comprehensive cover for any damage to your vehicle.</td></tr>
      </table>
      <div style="padding:1px 0;"></div>
      <div style="padding:1px 0;"></div>
      <table class="tb1">
        <tr><td class="bd tdl">017 - USE IN THE REPUBLIC OF IRELAND</td></tr>
        <tr><td>The Territorial Limits mentioned in your docs are amended to allow your vehicle to be used in the Republic of Ireland with indemnity as if it were in the United Kingdom.</td></tr>
      </table>
      <div style="padding:1px 0;"></div>
      <table class="tb1">
        <tr><td class="bd tdl">065 - FOREIGN USE EXTENSION</td></tr>
        <tr><td>We will insure you for the cover shown in your schedule while your motor vehicle is being used within:</td></tr>
        <tr><td>-any country in the European Union (EU).</td></tr>
        <tr><td>-Andorra, Iceland, Liechtenstein, Norway and Switzerland.</td></tr>
        <tr><td>Full details of your Foreign Use terms and conditions are stated within the Foreign Use section of your docs. This endorsement only applies if we have agreed and you have paid an additional premium.</td></tr>
      </table>`,
      importantInformation: `<table class="tb1">
        <tr><td class="bd">Important Information</td></tr>
      </table>
      <div style="padding:1px 0;"></div>
      <table class="tb1">
        <tr><td><span class="bd tdl"><strong>CONTINUOUS covernote ENFORCEMENT and the MOTOR covernote DATABASE </strong> Information relating to your policy will be added to the Motor covernote Database ('MID') managed by the Motor covernote Bureau ('MIB'). MID and the data stored on it may be used by certain statutory and/or authorised bodies including the Police, the DVLA, the DVLANI, the covernote Fraud Bureau and other bodies permitted by law for purposes including:</td></tr>
        <tr><td><ul><li>Electronic Licensing</li><li>Continuous docs Enforcement</li><li>Law enforcement (prevention, detection, apprehension and or prosecution of offenders)</li><li>The provision of government services and or other services aimed at reducing the level and incidence of uninsured driving.</li></ul></td></tr>
      </table>
      <div style="padding:1px 0;"></div>
      <table class="tb1">
        <tr><td>If you are involved in a road traffic accident (either in the UK, EEA or certain other territories), insurers and or the MIB may search the MID to obtain relevant information.</td></tr>
      </table>
      <div style="padding:1px 0;"></div>
      <table class="tb1">
        <tr><td class="tdl">Persons (including his or her appointed representatives) pursuing a claim in respect of a road traffic accident (including citizens of other countries) may also obtain information which is held on the MID. It is vital that the MID holds your correct registration number. If it is incorrectly shown on MID you are at risk of having your vehicle seized by the Police.</td></tr>
      </table>`,
    },
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load settings on component mount
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/settings", {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${await response.text()}`)
      }

      const result = await response.json()

      if (result.success && result.settings) {
        // Merge with defaults to ensure all properties exist
        setSettings((prevSettings: any) => {
          const newSettings = {
            ...prevSettings,
            ...result.settings,
            payment: {
              ...prevSettings.payment,
              ...result.settings.payment,
            },
          };
          // If loaded footer is empty, keep the default one from prevSettings
          if (result.settings.certificateTemplate && !result.settings.certificateTemplate.page1_footer) {
            newSettings.certificateTemplate.page1_footer = prevSettings.certificateTemplate.page1_footer;
          }
          if (result.settings.statementOfFactTemplate) {
            newSettings.statementOfFactTemplate = {
              ...prevSettings.statementOfFactTemplate,
              ...result.settings.statementOfFactTemplate,
            };
          }
          if (result.settings.viva) {
            newSettings.viva = {
              ...prevSettings.viva,
              ...result.settings.viva,
            };
          }
          if (result.settings.policyScheduleTemplate) {
            newSettings.policyScheduleTemplate = {
              ...prevSettings.policyScheduleTemplate,
              ...result.settings.policyScheduleTemplate,
            };
          }
          if (result.settings.general_uae) {
            newSettings.general_uae = {
              ...prevSettings.general_uae,
              ...result.settings.general_uae,
            };
          }
          if (result.settings.general) {
            newSettings.general = {
              ...prevSettings.general,
              ...result.settings.general,
            };
          }
          if (result.settings.maintenance) {
            newSettings.maintenance = {
              ...prevSettings.maintenance,
              ...result.settings.maintenance,
            };
          }
          if (result.settings.motApi) {
            newSettings.motApi = {
              ...prevSettings.motApi,
              ...result.settings.motApi,
            };
          }
          return newSettings;
        });
      } else {
        setError(result.error || "Unknown error occurred")
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
      setError(error instanceof Error ? error.message : "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (section: string, part: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [part]: value,
      },
    }))
    setHasChanges(true)
  }

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({
    paddle: false,
    stripe: false,
    mollie: false,
    airwallex: false,
    viva: false,
    square: false,
    lemonsqueezy: false,
    lemonsqueezy_webhook: false,
    openai: false,
    resend: false,
    vehicleApi: false,
    paypalSandbox: false,
    paypalLive: false,
    checkoutcomSandbox: false,
    checkoutcomLive: false,
    authorizenetSandbox: false,
    authorizenetLive: false,
    motApiKey: false,
    checkCarDetailsApiKey: false,
    motClientID: false,
    motClientSecret: false,
    motScopeUrl: false,
    motTokenUrl: false,
    fraudLabsPro: false,
  })

  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [testing, setTesting] = useState<Record<string, boolean>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [faviconUploadError, setFaviconUploadError] = useState<string | null>(null);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [uploadingLogoUae, setUploadingLogoUae] = useState(false);
  const [uploadingFaviconUae, setUploadingFaviconUae] = useState(false);
  const [faviconUploadErrorUae, setFaviconUploadErrorUae] = useState<string | null>(null);
  const [logoUploadErrorUae, setLogoUploadErrorUae] = useState<string | null>(null);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setLogoUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/upload-logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Logo upload failed");
      }

      const result = await response.json();
      if (result.url) {
        updateSetting("general", "logo", result.url);
      } else {
        throw new Error(result.error || "Unknown error during upload");
      }
    } catch (error) {
      setLogoUploadError(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFavicon(true);
    setFaviconUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/upload-logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Favicon upload failed");
      }

      const result = await response.json();
      if (result.url) {
        updateSetting("general", "favicon", result.url);
      } else {
        throw new Error(result.error || "Unknown error during upload");
      }
    } catch (error) {
      setFaviconUploadError(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setUploadingFavicon(false);
    }
  };

  const handleLogoUploadUae = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogoUae(true);
    setLogoUploadErrorUae(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/upload-logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Logo upload failed");
      }

      const result = await response.json();
      if (result.url) {
        updateSetting("general_uae", "logo", result.url);
      } else {
        throw new Error(result.error || "Unknown error during upload");
      }
    } catch (error) {
      setLogoUploadErrorUae(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setUploadingLogoUae(false);
    }
  };

  const handleFaviconUploadUae = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFaviconUae(true);
    setFaviconUploadErrorUae(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/upload-logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Favicon upload failed");
      }

      const result = await response.json();
      if (result.url) {
        updateSetting("general_uae", "favicon", result.url);
      } else {
        throw new Error(result.error || "Unknown error during upload");
      }
    } catch (error) {
      setFaviconUploadErrorUae(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setUploadingFaviconUae(false);
    }
  };

  const updateSquarePaymentMethod = (method: 'card' | 'googlePay' | 'applePay', checked: boolean) => {
    setSettings((prev: any) => ({
      ...prev,
      square: {
        ...prev.square,
        paymentMethods: {
          ...(prev.square?.paymentMethods || {
            card: true,
            googlePay: false,
            applePay: false,
          }),
          [method]: checked,
        },
      },
    }));
    setHasChanges(true)
  }

  const toggleKeyVisibility = (section: string) => {
    setShowKeys((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const testConnection = async (service: string) => {
    setTesting((prev) => ({ ...prev, [service]: true }))

    try {
      const response = await fetch("/api/admin/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service,
          config: settings[service as keyof typeof settings],
        }),
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }

      const result = await response.json()

      setTestResults((prev) => ({
        ...prev,
        [service]: {
          success: result.success,
          message: result.message,
          timestamp: new Date().toLocaleTimeString(),
        },
      }))
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [service]: {
          success: false,
          message: error instanceof Error ? error.message : "Connection test failed",
          timestamp: new Date().toLocaleTimeString(),
        },
      }))
    } finally {
      setTesting((prev) => ({ ...prev, [service]: false }))
    }
  }

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setHasChanges(false)
        await loadSettings()
        setTestResults((prev) => ({
          ...prev,
          save: {
            success: true,
            message: "Settings saved successfully",
            timestamp: new Date().toLocaleTimeString(),
          },
        }))
      } else {
        setTestResults((prev) => ({
          ...prev,
          save: {
            success: false,
            message: result.error || "Failed to save settings",
            timestamp: new Date().toLocaleTimeString(),
          },
        }))
      }
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        save: {
          success: false,
          message: error instanceof Error ? error.message : "Failed to save settings",
          timestamp: new Date().toLocaleTimeString(),
        },
      }))
    } finally {
      setIsSaving(false);
    }
  }

  const maskApiKey = (key: string) => {
    if (!key) return ""
    if (key.length <= 8) return "*".repeat(key.length)
    return key.substring(0, 4) + "*".repeat(key.length - 8) + key.substring(key.length - 4)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-8 h-8 border-4 border-t-teal-600 border-teal-200 rounded-full animate-spin"></div>
        <p className="text-gray-600">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Settings & Configuration</h2>
          <p className="text-gray-600">Manage API keys, integrations, and system settings</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadSettings} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={saveSettings} disabled={!hasChanges || isSaving} className="bg-teal-600 hover:bg-teal-700">
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save All Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="link" onClick={loadSettings} className="p-0 h-auto font-normal ml-2">
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {testResults.save && (
        <div
          className={`bg-${testResults.save.success ? "green" : "red"}-50 border border-${testResults.save.success ? "green" : "red"}-200 rounded-lg p-4`}
        >
          <div className="flex items-center space-x-2">
            {testResults.save.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            <span className={`${testResults.save.success ? "text-green-800" : "text-red-800"} font-medium`}>
              {testResults.save.message}
            </span>
            <span className={`${testResults.save.success ? "text-green-600" : "text-red-600"} text-sm`}>
              ({testResults.save.timestamp})
            </span>
          </div>
        </div>
      )}

      <Tabs defaultValue="payment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payment</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">AI</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="email_templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Email Templates</span>
          </TabsTrigger>
          <TabsTrigger value="document_templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Document Templates</span>
          </TabsTrigger>
          {/* <TabsTrigger value="vehicle" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Vehicle</span>
          </TabsTrigger> */}
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="quote-formula" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Quote Formula</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="payment" className="space-y-6">
          {/* Payment Processor Selection  */}
          <PaymentSettingsTab
            settings={settings}
            updateSetting={updateSetting}
            showKeys={showKeys}
            toggleKeyVisibility={toggleKeyVisibility}
            testConnection={testConnection}
            testing={testing}
            testResults={testResults}
            maskApiKey={maskApiKey}
          />
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <AISettingsTab
            settings={settings}
            updateSetting={updateSetting}
            showKeys={showKeys}
            toggleKeyVisibility={toggleKeyVisibility}
            testConnection={testConnection}
            testing={testing}
            maskApiKey={maskApiKey}
          />
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <ResendSettingsTab
            settings={settings}
            updateSetting={updateSetting}
            showKeys={showKeys}
            toggleKeyVisibility={toggleKeyVisibility}
            testConnection={testConnection}
            testing={testing}
            maskApiKey={maskApiKey}
          />
        </TabsContent>

        <TabsContent value="email_templates" className="space-y-6">
          <EmailTemplatesTab settings={settings} />
        </TabsContent>

        <TabsContent value="document_templates" className="space-y-6">
          <DocumentTemplatesTab settings={settings} updateSetting={updateSetting} />
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <GeneralSettingsTab
            settings={settings}
            updateSetting={updateSetting}
            showKeys={showKeys}
            toggleKeyVisibility={toggleKeyVisibility}
            testConnection={testConnection}
            testing={testing}
            testResults={testResults}
            maskApiKey={maskApiKey}
            handleLogoUpload={handleLogoUpload}
            uploadingLogo={uploadingLogo}
            logoUploadError={logoUploadError}
            handleFaviconUpload={handleFaviconUpload}
            uploadingFavicon={uploadingFavicon}
            faviconUploadError={faviconUploadError}
            handleLogoUploadUae={handleLogoUploadUae}
            uploadingLogoUae={uploadingLogoUae}
            logoUploadErrorUae={logoUploadErrorUae}
            handleFaviconUploadUae={handleFaviconUploadUae}
            uploadingFaviconUae={uploadingFaviconUae}
            faviconUploadErrorUae={faviconUploadErrorUae}
          />
        </TabsContent>
        <TabsContent value="quote-formula">
          <QuoteFormulaSettings settings={settings.quoteFormula} updateSetting={updateSetting} />
        </TabsContent>
      </Tabs>



      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">You have unsaved changes</span>
            </div>
            <Button onClick={saveSettings} size="sm" className="bg-yellow-600 hover:bg-yellow-700 w-full sm:w-auto" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Now'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}