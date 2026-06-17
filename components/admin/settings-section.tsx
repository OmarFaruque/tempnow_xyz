"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { QuoteFormulaSettings } from "./quote-formula-settings"
import { DocumentTemplatesTab } from "./document-templates-tab"

export function EmailTemplatesTab() {
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
                  className={`cursor-pointer transition-colors ${
                    activeTemplate === templateKey ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
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
                  <Label>Preview Content</Label>
                  <div className="p-4 bg-white border rounded-md max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-sans">
                      {replaceVariables(templates[activeTemplate as keyof typeof templates].content)}
                    </pre>
                  </div>
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
  const [settings, setSettings] = useState({
    payment: {
      activeProcessor: "mollie", // Changed from "paddle" to "mollie"
    },
    lemonsqueezy: {
      apiKey: "",
      storeId: "",
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
      logo: "",
      siteName: "MONZIC",
      supportEmail: "support@tempnow.uk",
      adminEmail: "admin@tempnow.uk",
      timezone: "Europe/London",
      currency: "GBP",
      policyScheduleVisible: true,
      productInformationVisible:false,
      statementOfFactVisible:false,
      carSearchApiProvider: "dayinsure",
      siteDomain: "",
      companyName: "",
      companyRegistration: "",
      effectiveDate: "",
      aliases: "",
      businessActivity: "",
      redirectUrl: "",
      activeRedirection: "0",
      checkoutCheckboxContent: "",
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
      const response = await fetch("/api/admin/settings")

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${await response.text()}`)
      }

      const result = await response.json()

      if (result.success && result.settings) {
        // Merge with defaults to ensure all properties exist
        setSettings((prevSettings) => {
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

  const [showKeys, setShowKeys] = useState({
    paddle: false,
    stripe: false,
    mollie: false,
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
  })

  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [testing, setTesting] = useState<Record<string, boolean>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [faviconUploadError, setFaviconUploadError] = useState<string | null>(null);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setLogoUploadError(null);

    try {
      const response = await fetch(`/api/admin/upload-logo?filename=${file.name}`, {
        method: "POST",
        body: file,
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

    try {
      const response = await fetch(`/api/admin/upload-logo?filename=${file.name}`, {
        method: "POST",
        body: file,
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

  const updateSquarePaymentMethod = (method: 'card' | 'googlePay' | 'applePay', checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      square: {
        ...prev.square,
        paymentMethods: {
          ...prev.square.paymentMethods,
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
          {/* Payment Processor Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Payment Processor Selection
              </CardTitle>
              <CardDescription>Choose which payment processor to use for checkout</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="active-processor">Active Payment Processor</Label>
                  <Select
                    value={settings.payment.activeProcessor}
                    onValueChange={(value) => updateSetting("payment", "activeProcessor", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paddle">
                        Paddle
                        <Badge className="ml-2 bg-blue-100 text-blue-800">Recommended</Badge>
                      </SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="mollie">Mollie</SelectItem>
                      <SelectItem value="airwallex">AirWallex</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="viva">Viva</SelectItem>
                      <SelectItem value="lemonsqueezy">Lemon Squeezy</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="checkoutcom">Checkout.com</SelectItem>
                      <SelectItem value="authorizenet">Authorize.Net</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    This processor will be used for all checkout transactions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paddle Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Paddle Payment Settings
                {settings.payment.activeProcessor === "paddle" && (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                )}
              </CardTitle>
              <CardDescription>Configure your Paddle payment processor integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paddle-vendor-id">Vendor ID</Label>
                  <Input
                    id="paddle-vendor-id"
                    placeholder="Enter your Paddle Vendor ID"
                    value={settings.paddle.vendorId}
                    onChange={(e) => updateSetting("paddle", "vendorId", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="paddle-environment">Environment</Label>
                  <Select
                    value={settings.paddle.environment}
                    onValueChange={(value) => updateSetting("paddle", "environment", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">
                        Sandbox
                        <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test</Badge>
                      </SelectItem>
                      <SelectItem value="production">
                        Production
                        <Badge className="ml-2 bg-green-100 text-green-800">Live</Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="paddle-api-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="paddle-api-key"
                    type={showKeys.paddle ? "text" : "password"}
                    placeholder="Enter your Paddle API Key"
                    value={showKeys.paddle ? settings.paddle.apiKey : maskApiKey(settings.paddle.apiKey)}
                    onChange={(e) => updateSetting("paddle", "apiKey", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("paddle")}>
                    {showKeys.paddle ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="paddle-client-token">Client Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="paddle-client-token"
                    type={showKeys.paddle ? "text" : "password"}
                    placeholder="Enter your Paddle Client Token"
                    value={showKeys.paddle ? settings.paddle.clientToken : maskApiKey(settings.paddle.clientToken)}
                    onChange={(e) => updateSetting("paddle", "clientToken", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("paddle")}>
                    {showKeys.paddle ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="paddle-discord-refund-webhook">Refund Discord Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="paddle-discord-refund-webhook"
                    type={showKeys.paddle ? "text" : "password"}
                    placeholder="https://discord.com/api/webhooks/..."
                    value={showKeys.paddle ? settings.paddle.discordRefundWebhookUrl : maskApiKey(settings.paddle.discordRefundWebhookUrl)}
                    onChange={(e) => updateSetting("paddle", "discordRefundWebhookUrl", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("paddle")}>
                    {showKeys.paddle ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <small className="text-xs text-gray-500">Instant refund/chargeback alerts are sent to this Discord webhook.</small>
              </div>

              <Button
                onClick={() => testConnection("paddle")}
                disabled={testing.paddle || !settings.paddle.apiKey}
                variant="outline"
                className="w-full"
              >
                {testing.paddle ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Paddle Connection
                  </>
                )}
              </Button>

              {testResults.paddle && (
                <div
                  className={`p-3 rounded-lg border ${testResults.paddle.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                >
                  <div className="flex items-center space-x-2">
                    {testResults.paddle.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`text-sm font-medium ${testResults.paddle.success ? "text-green-800" : "text-red-800"}`}
                    >
                      {testResults.paddle.message}
                    </span>
                    <span className="text-xs text-gray-500">({testResults.paddle.timestamp})</span>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500">
                Use this Paddle webhook URL in your Paddle dashboard: <i>{process.env.NEXT_PUBLIC_BASE_URL}/api/paddle/webhook</i>
              </div>
            </CardContent>
          </Card>

          {/* Stripe Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Stripe Payment Settings
                {settings.payment.activeProcessor === "stripe" && (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                )}
              </CardTitle>
              <CardDescription>Configure your Stripe payment processor integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stripe-environment">Environment</Label>
                <Select
                  value={settings.stripe.environment}
                  onValueChange={(value) => updateSetting("stripe", "environment", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">
                      Test Mode
                      <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test</Badge>
                    </SelectItem>
                    <SelectItem value="production">
                      Live Mode
                      <Badge className="ml-2 bg-green-100 text-green-800">Live</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <br/>
              </div>
              <div className="mt-2"><small className="text-xs text-gray-500"><i>Webhook URL: {process.env.NEXT_PUBLIC_BASE_URL}/api/stripe-webhook</i></small></div>

              <Button
                onClick={() => testConnection("stripe")}
                disabled={testing.stripe || !process.env.STRIPE_SECRET_KEY}
                variant="outline"
                className="w-full"
              >
                {testing.stripe ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Stripe Connection
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Lemon Squeezy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-yellow-500" />
                Lemon Squeezy Payment Settings
                {settings.payment.activeProcessor === "lemonsqueezy" && (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                )}
              </CardTitle>
              <CardDescription>Configure your Lemon Squeezy payment processor integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lemonsqueezy-store-id">Store ID</Label>
                  <Input
                    id="lemonsqueezy-store-id"
                    placeholder="Enter your Lemon Squeezy Store ID"
                    value={settings?.lemonsqueezy?.storeId}
                    onChange={(e) => updateSetting("lemonsqueezy", "storeId", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="lemonsqueezy-variant-id">Variant ID</Label>
                  <Input
                    id="lemonsqueezy-variant-id"
                    placeholder="Enter your Lemon Squeezy Variant ID"
                    value={settings?.lemonsqueezy?.variantId}
                    onChange={(e) => updateSetting("lemonsqueezy", "variantId", e.target.value)}
                  />
                </div>

              </div>

              <div>
                <Label htmlFor="lemonsqueezy-api-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="lemonsqueezy-api-key"
                    type={showKeys.lemonsqueezy ? "text" : "password"}
                    placeholder="Enter your Lemon Squeezy API Key"
                    value={showKeys.lemonsqueezy ? settings?.lemonsqueezy?.apiKey : maskApiKey(settings?.lemonsqueezy?.apiKey)}
                    onChange={(e) => updateSetting("lemonsqueezy", "apiKey", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("lemonsqueezy")}>
                    {showKeys.lemonsqueezy ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="lemonsqueezy-webhook-secret">Webhook Secret</Label>
                <div className="flex gap-2">
                  <Input
                    id="lemonsqueezy-webhook-secret"
                    type={showKeys.lemonsqueezy_webhook ? "text" : "password"}
                    placeholder="webhook secret..."
                    value={showKeys.lemonsqueezy_webhook ? settings?.lemonsqueezy?.webhookSecret : maskApiKey(settings?.lemonsqueezy?.webhookSecret)}
                    onChange={(e) => updateSetting("lemonsqueezy", "webhookSecret", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("lemonsqueezy_webhook")}>
                    {showKeys.lemonsqueezy_webhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <small> This is used to verify webhook events from Lemon Squeezy. <i>Webhook URL: {process.env.NEXT_PUBLIC_BASE_URL}/api/lemonsqueezy-webhook</i></small>
              </div>

              <Button
                onClick={() => testConnection("lemonsqueezy")}
                disabled={testing.lemonsqueezy || !settings?.lemonsqueezy?.apiKey}
                variant="outline"
                className="w-full"
              >
                {testing.lemonsqueezy ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Lemon Squeezy Connection
                  </>
                )}
              </Button>
            </CardContent>
          </Card>


          {/* Airwallex Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-600" />
                Airwallex Payment Settings
              </CardTitle>
              <CardDescription>Configure your Airwallex payment processor integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="airwallex-environment">Environment</Label>
                <Select
                  value={settings?.airwallex?.environment}
                  onValueChange={(value) => updateSetting("airwallex", "environment", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">
                      Test Mode
                      <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test</Badge>
                    </SelectItem>
                    <SelectItem value="production">
                      Live Mode
                      <Badge className="ml-2 bg-green-100 text-green-800">Live</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="airwallex-publishable-key">Airwallex Client ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="airwallex-publishable-key"
                    type={showKeys.airwallex ? "text" : "password"}
                    placeholder="client id..."
                    value={
                      showKeys.airwallex ? settings?.airwallex?.client_id : maskApiKey(settings?.airwallex?.client_id)
                    }
                    onChange={(e) => updateSetting("airwallex", "client_id", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("airwallex")}>
                    {showKeys.airwallex ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="airwallex-secret-key">API Key</Label>
                <Input
                  id="airwallex-secret-key"
                  type="password"
                  placeholder="apikey..."
                  value={settings?.airwallex?.apikey}
                  onChange={(e) => updateSetting("airwallex", "apikey", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="airwallex-webhook-secret">Webhook Secret</Label>
                <Input
                  id="airwallex-webhook-secret"
                  type="password"
                  placeholder="webhook secret..."
                  value={settings?.airwallex?.webhookSecret}
                  onChange={(e) => updateSetting("airwallex", "webhookSecret", e.target.value)}
                />
                <small> This is used to verify webhook events from Airwallex. <i>Webhook URL: {process.env.NEXT_PUBLIC_BASE_URL}/api/airwallex-webhook</i></small>
              </div>

              <Button
                onClick={() => testConnection("airwallex")}
                disabled={testing.airwallex || !settings?.airwallex?.apikey}
                variant="outline"
                className="w-full"
              >
                {testing.airwallex ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Airwallex Connection
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Square Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-800" />
                Square Payment Settings
                {settings.payment.activeProcessor === "square" && (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                )}
              </CardTitle>
              <CardDescription>Configure your Square payment processor integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="square-environment">Environment</Label>
                <Select
                  value={settings.square.environment}
                  onValueChange={(value) => updateSetting("square", "environment", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">
                      Sandbox
                      <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test</Badge>
                    </SelectItem>
                    <SelectItem value="production">
                      Production
                      <Badge className="ml-2 bg-green-100 text-green-800">Live</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="square-app-id">App ID</Label>
                  <Input
                    id="square-app-id"
                    placeholder="Enter your Square App ID"
                    value={settings.square.appId}
                    onChange={(e) => updateSetting("square", "appId", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="square-location-id">App Location ID</Label>
                  <Input
                    id="square-location-id"
                    placeholder="Enter your Square Location ID"
                    value={settings.square.appLocationId}
                    onChange={(e) => updateSetting("square", "appLocationId", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="square-access-token">App Access Token</Label>
                <Input
                  id="square-access-token"
                  type={showKeys.square ? "text" : "password"}
                  placeholder="Enter your Square Access Token"
                  value={showKeys.square ? settings.square.accessToken : maskApiKey(settings.square.accessToken)}
                  onChange={(e) => updateSetting("square", "accessToken", e.target.value)}
                />
              </div>

              <div>
                <Label>Square Payment Methods</Label>
                <div className="mt-2 space-y-2 rounded-md border p-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="square-card" checked={settings.square.paymentMethods.card} onCheckedChange={(checked) => updateSquarePaymentMethod('card', !!checked)} />
                    <Label htmlFor="square-card">Card Payment</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="square-google" checked={settings.square.paymentMethods.googlePay} onCheckedChange={(checked) => updateSquarePaymentMethod('googlePay', !!checked)} />
                    <Label htmlFor="square-google">Google Pay</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="square-apple" checked={settings.square.paymentMethods.applePay} onCheckedChange={(checked) => updateSquarePaymentMethod('applePay', !!checked)} />
                    <Label htmlFor="square-apple">Apple Pay</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mollie Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-orange-600" />
                Mollie Payment Settings
                {settings.payment.activeProcessor === "mollie" && (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                )}
              </CardTitle>
              <CardDescription>Configure your Mollie payment processor integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mollie-environment">Environment</Label>
                <Select
                  value={settings.mollie.environment}
                  onValueChange={(value) => updateSetting("mollie", "environment", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">
                      Test Mode
                      <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test</Badge>
                    </SelectItem>
                    <SelectItem value="production">
                      Live Mode
                      <Badge className="ml-2 bg-green-100 text-green-800">Live</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="mollie-api-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="mollie-api-key"
                    type={showKeys.mollie ? "text" : "password"}
                    placeholder="test_... or live_..."
                    value={showKeys.mollie ? settings.mollie.apiKey : maskApiKey(settings.mollie.apiKey)}
                    onChange={(e) => updateSetting("mollie", "apiKey", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("mollie")}>
                    {showKeys.mollie ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => testConnection("mollie")}
                disabled={testing.mollie || !settings.mollie.apiKey}
                variant="outline"
                className="w-full"
              >
                {testing.mollie ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Mollie Connection
                  </>
                )}
              </Button>
            </CardContent>
          </Card>



          {/* PayPal Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-700" />
                PayPal Payment Settings
                {settings.payment.activeProcessor === "paypal" && (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                )}
              </CardTitle>
              <CardDescription>Configure separate sandbox and live PayPal credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="paypal-environment">Mode</Label>
                <Select
                  value={settings.paypal.environment}
                  onValueChange={(value) => updateSetting("paypal", "environment", value)}
                >
                  <SelectTrigger id="paypal-environment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">
                      Sandbox
                      <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test</Badge>
                    </SelectItem>
                    <SelectItem value="live">
                      Live
                      <Badge className="ml-2 bg-green-100 text-green-800">Production</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Credential inputs below automatically switch based on selected mode.</p>
              </div>

              {settings.paypal.environment === "sandbox" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paypal-sandbox-client-id">Sandbox Client ID</Label>
                    <Input
                      id="paypal-sandbox-client-id"
                      type={showKeys.paypalSandbox ? "text" : "password"}
                      placeholder="Enter your sandbox client ID"
                      value={showKeys.paypalSandbox ? settings.paypal.sandboxClientId : maskApiKey(settings.paypal.sandboxClientId)}
                      onChange={(e) => updateSetting("paypal", "sandboxClientId", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="paypal-sandbox-secret">Sandbox Secret</Label>
                    <div className="flex gap-2">
                      <Input
                        id="paypal-sandbox-secret"
                        type={showKeys.paypalSandbox ? "text" : "password"}
                        placeholder="Enter your sandbox secret"
                        value={showKeys.paypalSandbox ? settings.paypal.sandboxSecret : maskApiKey(settings.paypal.sandboxSecret)}
                        onChange={(e) => updateSetting("paypal", "sandboxSecret", e.target.value)}
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("paypalSandbox")}>
                        {showKeys.paypalSandbox ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="paypal-live-client-id">Live Client ID</Label>
                    <Input
                      id="paypal-live-client-id"
                      type={showKeys.paypalLive ? "text" : "password"}
                      placeholder="Enter your live client ID"
                      value={showKeys.paypalLive ? settings.paypal.liveClientId : maskApiKey(settings.paypal.liveClientId)}
                      onChange={(e) => updateSetting("paypal", "liveClientId", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="paypal-live-secret">Live Secret</Label>
                    <div className="flex gap-2">
                      <Input
                        id="paypal-live-secret"
                        type={showKeys.paypalLive ? "text" : "password"}
                        placeholder="Enter your live secret"
                        value={showKeys.paypalLive ? settings.paypal.liveSecret : maskApiKey(settings.paypal.liveSecret)}
                        onChange={(e) => updateSetting("paypal", "liveSecret", e.target.value)}
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("paypalLive")}>
                        {showKeys.paypalLive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>


          {/* checkout.com Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-700" />
                Checkout.com Payment Settings
                {settings.payment.activeProcessor === "checkoutcom" && (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                )}
              </CardTitle>
              <CardDescription>Configure separate sandbox and live Checkout.com credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="checkoutcom-environment">Mode</Label>
                <Select
                  value={settings.checkoutcom.environment}
                  onValueChange={(value) => updateSetting("checkoutcom", "environment", value)}
                >
                  <SelectTrigger id="checkoutcom-environment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">
                      Sandbox
                      <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test</Badge>
                    </SelectItem>
                    <SelectItem value="live">
                      Live
                      <Badge className="ml-2 bg-green-100 text-green-800">Production</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Credential inputs below automatically switch based on selected mode.</p>
              </div>

              {settings.checkoutcom.environment === "sandbox" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkoutcom-sandbox-public-key">Sandbox Public Key</Label>
                    <Input
                      id="checkoutcom-sandbox-public-key"
                      type={showKeys.checkoutcomSandbox ? "text" : "password"}
                      placeholder="pk_test_..."
                      value={showKeys.checkoutcomSandbox ? settings.checkoutcom.sandboxPublicKey : maskApiKey(settings.checkoutcom.sandboxPublicKey)}
                      onChange={(e) => updateSetting("checkoutcom", "sandboxPublicKey", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkoutcom-sandbox-secret-key">Sandbox Secret Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="checkoutcom-sandbox-secret-key"
                        type={showKeys.checkoutcomSandbox ? "text" : "password"}
                        placeholder="sk_test_..."
                        value={showKeys.checkoutcomSandbox ? settings.checkoutcom.sandboxSecretKey : maskApiKey(settings.checkoutcom.sandboxSecretKey)}
                        onChange={(e) => updateSetting("checkoutcom", "sandboxSecretKey", e.target.value)}
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("checkoutcomSandbox")}>
                        {showKeys.checkoutcomSandbox ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkoutcom-live-public-key">Live Public Key</Label>
                    <Input
                      id="checkoutcom-live-public-key"
                      type={showKeys.checkoutcomLive ? "text" : "password"}
                      placeholder="pk_live_..."
                      value={showKeys.checkoutcomLive ? settings.checkoutcom.livePublicKey : maskApiKey(settings.checkoutcom.livePublicKey)}
                      onChange={(e) => updateSetting("checkoutcom", "livePublicKey", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkoutcom-live-secret-key">Live Secret Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="checkoutcom-live-secret-key"
                        type={showKeys.checkoutcomLive ? "text" : "password"}
                        placeholder="sk_live_..."
                        value={showKeys.checkoutcomLive ? settings.checkoutcom.liveSecretKey : maskApiKey(settings.checkoutcom.liveSecretKey)}
                        onChange={(e) => updateSetting("checkoutcom", "liveSecretKey", e.target.value)}
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("checkoutcomLive")}>
                        {showKeys.checkoutcomLive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Authorize.Net Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-sky-700" />
                Authorize.Net Payment Settings
                {settings.payment.activeProcessor === "authorizenet" && (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                )}
              </CardTitle>
              <CardDescription>Configure separate sandbox and live Authorize.Net credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="authorizenet-environment">Mode</Label>
                <Select
                  value={settings.authorizenet.environment}
                  onValueChange={(value) => updateSetting("authorizenet", "environment", value)}
                >
                  <SelectTrigger id="authorizenet-environment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">
                      Sandbox
                      <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test</Badge>
                    </SelectItem>
                    <SelectItem value="live">
                      Live
                      <Badge className="ml-2 bg-green-100 text-green-800">Production</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.authorizenet.environment === "sandbox" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="authorizenet-sandbox-login-id">Sandbox API Login ID</Label>
                    <Input
                      id="authorizenet-sandbox-login-id"
                      type={showKeys.authorizenetSandbox ? "text" : "password"}
                      placeholder="Enter sandbox API Login ID"
                      value={showKeys.authorizenetSandbox ? settings.authorizenet.sandboxApiLoginId : maskApiKey(settings.authorizenet.sandboxApiLoginId)}
                      onChange={(e) => updateSetting("authorizenet", "sandboxApiLoginId", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="authorizenet-sandbox-transaction-key">Sandbox Transaction Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="authorizenet-sandbox-transaction-key"
                        type={showKeys.authorizenetSandbox ? "text" : "password"}
                        placeholder="Enter sandbox transaction key"
                        value={showKeys.authorizenetSandbox ? settings.authorizenet.sandboxTransactionKey : maskApiKey(settings.authorizenet.sandboxTransactionKey)}
                        onChange={(e) => updateSetting("authorizenet", "sandboxTransactionKey", e.target.value)}
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("authorizenetSandbox")}>
                        {showKeys.authorizenetSandbox ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="authorizenet-sandbox-client-key">Sandbox Client Key (Accept.js)</Label>
                    <Input
                      id="authorizenet-sandbox-client-key"
                      type={showKeys.authorizenetSandbox ? "text" : "password"}
                      placeholder="Enter sandbox client key"
                      value={showKeys.authorizenetSandbox ? settings.authorizenet.sandboxClientKey : maskApiKey(settings.authorizenet.sandboxClientKey)}
                      onChange={(e) => updateSetting("authorizenet", "sandboxClientKey", e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="authorizenet-live-login-id">Live API Login ID</Label>
                    <Input
                      id="authorizenet-live-login-id"
                      type={showKeys.authorizenetLive ? "text" : "password"}
                      placeholder="Enter live API Login ID"
                      value={showKeys.authorizenetLive ? settings.authorizenet.liveApiLoginId : maskApiKey(settings.authorizenet.liveApiLoginId)}
                      onChange={(e) => updateSetting("authorizenet", "liveApiLoginId", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="authorizenet-live-transaction-key">Live Transaction Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="authorizenet-live-transaction-key"
                        type={showKeys.authorizenetLive ? "text" : "password"}
                        placeholder="Enter live transaction key"
                        value={showKeys.authorizenetLive ? settings.authorizenet.liveTransactionKey : maskApiKey(settings.authorizenet.liveTransactionKey)}
                        onChange={(e) => updateSetting("authorizenet", "liveTransactionKey", e.target.value)}
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("authorizenetLive")}>
                        {showKeys.authorizenetLive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="authorizenet-live-client-key">Live Client Key (Accept.js)</Label>
                    <Input
                      id="authorizenet-live-client-key"
                      type={showKeys.authorizenetLive ? "text" : "password"}
                      placeholder="Enter live client key"
                      value={showKeys.authorizenetLive ? settings.authorizenet.liveClientKey : maskApiKey(settings.authorizenet.liveClientKey)}
                      onChange={(e) => updateSetting("authorizenet", "liveClientKey", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>



          {/* Viva Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Viva Payment Settings
                {settings.payment.activeProcessor === "viva" && (
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                )}
              </CardTitle>
              <CardDescription>Configure your Viva payment processor integration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="viva-merchant-id">Merchant ID / Client ID</Label>
                  <Input
                    id="viva-merchant-id"
                    placeholder="Enter your Viva Merchant ID"
                    value={settings.viva.merchantId}
                    onChange={(e) => updateSetting("viva", "merchantId", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="viva-environment">Environment</Label>
                  <Select
                    value={settings.viva.env}
                    onValueChange={(value) => updateSetting("viva", "env", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo">
                        Demo
                        <Badge className="ml-2 bg-yellow-100 text-yellow-800">Test</Badge>
                      </SelectItem>
                      <SelectItem value="live">
                        Live
                        <Badge className="ml-2 bg-green-100 text-green-800">Live</Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="viva-api-key">API Key / Client Secret</Label>
                <div className="flex gap-2">
                  <Input
                    id="viva-api-key"
                    type={showKeys.viva ? "text" : "password"}
                    placeholder="Enter your Viva API Key"
                    value={showKeys.viva ? settings.viva.apiKey : maskApiKey(settings.viva.apiKey)}
                    onChange={(e) => updateSetting("viva", "apiKey", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("viva")}>
                    {showKeys.viva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="viva-source-code">Source Code</Label>
                <Input
                  id="viva-source-code"
                  placeholder="Enter your Viva Source Code"
                  value={settings.viva.sourceCode}
                  onChange={(e) => updateSetting("viva", "sourceCode", e.target.value)}
                />
              </div>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Action Required: Configure Viva Settings</AlertTitle>
                <AlertDescription>
                  Please set the following URLs in your Viva Payment profile settings:
                  <ul className="mt-2 list-disc pl-5 space-y-1">
                    <li><span className="font-medium">Success URL:</span> <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">{process.env.NEXT_PUBLIC_BASE_URL}/payment-confirmation</code></li>
                    <li><span className="font-medium">Failed URL:</span> <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">{process.env.NEXT_PUBLIC_BASE_URL}/payment-failed</code></li>
                  </ul>
                  These URLs are crucial for Viva to redirect your customers after payment.
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => testConnection("viva")}
                disabled={testing.viva || !settings.viva.apiKey}
                variant="outline"
                className="w-full"
              >
                {testing.viva ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Viva Connection
                  </>
                )}
              </Button>

              {testResults.viva && (
                <div
                  className={`p-3 rounded-lg border ${testResults.viva.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                >
                  <div className="flex items-center space-x-2">
                    {testResults.viva.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`text-sm font-medium ${testResults.viva.success ? "text-green-800" : "text-red-800"}`}
                    >
                      {testResults.viva.message}
                    </span>
                    <span className="text-xs text-gray-500">({testResults.viva.timestamp})</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bank Payment Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Bank Payment Settings
              </CardTitle>
              <CardDescription>
                Configure settings for manual bank transfers. This option will appear alongside your active payment processor.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Checkbox
                  id="show-bank-payment"
                  checked={settings.bank.show}
                  onCheckedChange={(checked) => updateSetting("bank", "show", !!checked)}
                />
                <Label htmlFor="show-bank-payment" className="font-medium text-blue-800">
                  Enable Bank Payment option at checkout
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank-account-name">Account Name</Label>
                  <Input
                    id="bank-account-name"
                    placeholder="Enter your Bank Account Name"
                    value={settings.bank.name}
                    onChange={(e) => updateSetting("bank", "name", e.target.value)}
                    disabled={!settings.bank.show}
                  />
                </div>
                <div>
                  <Label htmlFor="bank-account-number">Account Number</Label>
                  <Input
                    id="bank-account-number"
                    placeholder="Enter your Bank Account Number"
                    value={settings.bank.accountNumber}
                    onChange={(e) => updateSetting("bank", "accountNumber", e.target.value)}
                    disabled={!settings.bank.show}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank-sort-code">Sort Code</Label>
                  <Input
                    id="bank-sort-code"
                    placeholder="e.g., 04-00-04"
                    value={settings.bank.sortCode}
                    onChange={(e) => updateSetting("bank", "sortCode", e.target.value)}
                    disabled={!settings.bank.show}
                  />
                </div>
                <div>
                  <Label htmlFor="bank-reference">Reference Information</Label>
                  <Input
                    id="bank-reference"
                    placeholder="e.g., Use your quote ID as the payment reference."
                    value={settings.bank.reference}
                    onChange={(e) => updateSetting("bank", "reference", e.target.value)}
                    disabled={!settings.bank.show}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bank-info-text">Additional Info Text</Label>
                <Textarea
                  id="bank-info-text"
                  placeholder="e.g., Your quote will be marked as paid once we confirm receipt of your payment."
                  value={settings.bank.info}
                  onChange={(e) => updateSetting("bank", "info", e.target.value)}
                  disabled={!settings.bank.show}
                />
              </div>
              <div>
                <Label htmlFor="bank-discount">Percentage Off for Bank Payment (%)</Label>
                <Input id="bank-discount" type="number" value={settings.bank.discountPercentage} onChange={(e) => updateSetting("bank", "discountPercentage", Number(e.target.value))} disabled={!settings.bank.show} />
                <p className="text-xs text-gray-500 mt-1">Apply a discount for customers who choose to pay via bank transfer. Enter 0 for no discount.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

         <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                OpenAI Settings
              </CardTitle>
              <CardDescription>Configure OpenAI for document generation and AI features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="openai-api-key">OpenAI API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="openai-api-key"
                    type={showKeys.openai ? "text" : "password"}
                    placeholder="sk-..."
                    value={showKeys.openai ? settings.openai.apiKey : maskApiKey(settings.openai.apiKey)}
                    onChange={(e) => updateSetting("openai", "apiKey", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("openai")}>
                    {showKeys.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="openai-model">Model</Label>
                  <Select
                    value={settings.openai.model}
                    onValueChange={(value) => updateSetting("openai", "model", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">
                        GPT-4 <Badge className="ml-2 bg-green-100 text-green-800">Recommended</Badge>
                      </SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="openai-min-price">Min Price</Label>
                  <Input
                    id="openai-min-price"
                    type="number"
                    placeholder="10"
                    value={settings.openai.minPrice}
                    onChange={(e) => updateSetting("openai", "minPrice", Number.parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="openai-max-price">Max Price</Label>
                  <Input
                    id="openai-max-price"
                    type="number"
                    placeholder="50"
                    value={settings.openai.maxPrice}
                    onChange={(e) => updateSetting("openai", "maxPrice", Number.parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Button
                onClick={() => testConnection("openai")}
                disabled={testing.openai || !settings.openai.apiKey}
                variant="outline"
                className="w-full"
              >
                {testing.openai ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test AI Connection
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
                
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-green-600" />
                Email Service (Resend)
              </CardTitle>
              <CardDescription>Configure email sending service for notifications and receipts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="resend-api-key">Resend API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="resend-api-key"
                    type={showKeys.resend ? "text" : "password"}
                    placeholder="re_..."
                    value={showKeys.resend ? settings.resend.apiKey : maskApiKey(settings.resend.apiKey)}
                    onChange={(e) => updateSetting("resend", "apiKey", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("resend")}>
                    {showKeys.resend ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="resend-domain">Email Domain</Label>
                  <Input
                    id="resend-domain"
                    placeholder="monzic.co.uk"
                    value={settings.resend.domain}
                    onChange={(e) => updateSetting("resend", "domain", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="resend-from-email">From Email</Label>
                  <Input
                    id="resend-from-email"
                    placeholder="noreply@monzic.co.uk"
                    value={settings.resend.fromEmail}
                    onChange={(e) => updateSetting("resend", "fromEmail", e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={() => testConnection("resend")}
                disabled={testing.resend || !settings.resend.apiKey}
                variant="outline"
                className="w-full"
              >
                {testing.resend ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Email Service
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email_templates" className="space-y-6">
          <EmailTemplatesTab />
        </TabsContent>

        <TabsContent value="document_templates" className="space-y-6">
          <DocumentTemplatesTab settings={settings} updateSetting={updateSetting} />
        </TabsContent>

        <TabsContent value="vehicle" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-orange-600" />
                Vehicle Data API
              </CardTitle>
              <CardDescription>Configure vehicle data fetching service for docs quotes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="vehicle-api-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="vehicle-api-key"
                    type={showKeys.vehicleApi ? "text" : "password"}
                    placeholder="Enter your Vehicle Data API Key"
                    value={showKeys.vehicleApi ? settings.vehicleApi.apiKey : maskApiKey(settings.vehicleApi.apiKey)}
                    onChange={(e) => updateSetting("vehicleApi", "apiKey", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("vehicleApi")}>
                    {showKeys.vehicleApi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                onClick={() => testConnection("vehicleApi")}
                disabled={testing.vehicleApi || !settings.vehicleApi.apiKey}
                variant="outline"
                className="w-full"
              >
                {testing.vehicleApi ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Vehicle API
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-gray-600" />
                General Settings
              </CardTitle>
              <CardDescription>Configure general application settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Site Name</Label>
                  <Input
                    id="site-name"
                    value={settings.general.siteName}
                    onChange={(e) => updateSetting("general", "siteName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={settings.general.currency}
                    onValueChange={(value) => updateSetting("general", "currency", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input
                    id="support-email"
                    type="email"
                    value={settings.general.supportEmail}
                    onChange={(e) => updateSetting("general", "supportEmail", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={settings.general.adminEmail}
                    onChange={(e) => updateSetting("general", "adminEmail", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-domain">Site domain</Label>
                  <Input
                    id="site-domain"
                    type="text"
                    value={settings.general.siteDomain}
                    onChange={(e) => updateSetting("general", "siteDomain", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    type="text"
                    value={settings.general.companyName}
                    onChange={(e) => updateSetting("general", "companyName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-registration">Company Registration</Label>
                  <Input
                    id="company-registration"
                    type="text"
                    value={settings.general.companyRegistration}
                    onChange={(e) => updateSetting("general", "companyRegistration", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="effective-date">Effective Date</Label>
                  <Input
                    id="effective-date"
                    type="date"
                    value={settings.general.effectiveDate}
                    onChange={(e) => updateSetting("general", "effectiveDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aliases">Aliases</Label>
                  <Input
                    id="aliases"
                    type="text"
                    value={settings.general.aliases}
                    onChange={(e) => updateSetting("general", "aliases", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessActivity">Business Activity</Label>
                  <Input
                    id="businessActivity"
                    type="text"
                    value={settings.general.businessActivity}
                    onChange={(e) => updateSetting("general", "businessActivity", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="redirectUrl">Redirect URL</Label>
                  <Input
                    id="redirectUrl"
                    type="url"
                    value={settings.general?.redirectUrl}
                    onChange={(e) => updateSetting("general", "redirectUrl", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activeRedirection">Active Redirection</Label>
                  <Select
                    value={settings.general?.activeRedirection}
                    onValueChange={(value) => updateSetting("general", "activeRedirection", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Yes</SelectItem>
                      <SelectItem value="0">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="checkout-checkbox-content">Checkout Checkbox Content</Label>
                  <Textarea
                    id="checkout-checkbox-content"
                    value={settings.general.checkoutCheckboxContent}
                    onChange={(e) => updateSetting("general", "checkoutCheckboxContent", e.target.value)}
                    placeholder="Enter checkbox content. Separate multiple checkboxes with ||"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500">
                    Use || to separate multiple checkboxes. You can use HTML for links, e.g., &lt;a href="/terms"&gt;Terms&lt;/a&gt;.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                <div className="space-y-2">
                    <Label>Site Logo</Label>
                    <div className="flex items-center gap-4 rounded-lg border p-4">
                      <div className="w-24 h-24 rounded-md flex items-center justify-center bg-gray-50 overflow-hidden">
                        {settings.general.logo ? (
                          <img src={settings.general.logo} alt="Logo Preview" className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-xs text-gray-500">No Logo</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          id="logo-upload"
                          type="file"
                          accept="image/png, image/jpeg, image/svg+xml"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <Button asChild variant="outline">
                          <label htmlFor="logo-upload" className="cursor-pointer w-full flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            {uploadingLogo ? "Uploading..." : "Upload Logo"}
                          </label>
                        </Button>
                        <p className="text-xs text-gray-500">PNG, JPG, SVG. Max 2MB.</p>
                        {logoUploadError && <p className="text-sm text-red-500 mt-1">{logoUploadError}</p>}
                      </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Favicon</Label>
                    <div className="flex items-center gap-4 rounded-lg border p-4">
                      <div className="w-24 h-24 rounded-md flex items-center justify-center bg-gray-50 overflow-hidden">
                        {settings.general.favicon ? (
                          <img src={settings.general.favicon} alt="Favicon Preview" className="h-16 w-16 object-contain" />
                        ) : (
                          <span className="text-xs text-gray-500">No Favicon</span>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input id="favicon-upload" type="file" accept=".jpg, image/x-icon, image/png, image/jpeg, image/svg+xml" onChange={handleFaviconUpload} className="hidden" />
                        <Button asChild variant="outline">
                          <label htmlFor="favicon-upload" className="cursor-pointer w-full flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            {uploadingFavicon ? "Uploading..." : "Upload Favicon"}
                          </label>
                        </Button>
                        <p className="text-xs text-gray-500">ICO, PNG, SVG. Recommended: 32x32px.</p>
                        {faviconUploadError && <p className="text-sm text-red-500 mt-1">{faviconUploadError}</p>}
                      </div>
                    </div>
                </div>
              </div>
              <div className="space-y-4 pt-6 border-t">
                <h4 className="text-lg font-medium">Document Visibility</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="policy-schedule-visible">Order Schedule</Label>
                    <Select
                      value={settings.general.policyScheduleVisible ? "visible" : "hidden"}
                      onValueChange={(value) => updateSetting("general", "policyScheduleVisible", value === "visible")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visible">Visible</SelectItem>
                        <SelectItem value="hidden">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-information-visible">Product Information</Label>
                    <Select
                      value={settings.general?.productInformationVisible ? "visible" : "hidden"}
                      onValueChange={(value) => updateSetting("general", "productInformationVisible", value === "visible")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visible">Visible</SelectItem>
                        <SelectItem value="hidden">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="statement-of-fact-visible">Statement of Fact</Label>
                    <Select
                      value={settings.general?.statementOfFactVisible ? "visible" : "hidden"}
                      onValueChange={(value) => updateSetting("general", "statementOfFactVisible", value === "visible")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visible">Visible</SelectItem>
                        <SelectItem value="hidden">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t">
                <h4 className="text-lg font-medium">Car Search</h4>
                <div className="max-w-md space-y-2">
                  <Label htmlFor="car-search-provider">Car Search API Provider</Label>
                  <Select
                    value={settings.general.carSearchApiProvider}
                    onValueChange={(value) => updateSetting("general", "carSearchApiProvider", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dayinsure">Dayinsure</SelectItem>
                      <SelectItem value="mot">MOT</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Select the provider for vehicle registration lookups.
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
                    <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                FraudLabsPro Integration
              </CardTitle>
              <CardDescription>Configure FraudLabsPro for payment fraud detection and prevention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  FraudLabsPro provides advanced fraud detection and prevention for online payments. Enable this service to protect your customers from fraudulent transactions.
                </p>
              </div>

              <div className="flex items-center space-x-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <Checkbox
                  id="enable-fraud-detection"
                  checked={settings.fraudLabsPro?.enabled || false}
                  onCheckedChange={(checked) => updateSetting("fraudLabsPro", "enabled", !!checked)}
                />
                <Label htmlFor="enable-fraud-detection" className="font-medium text-gray-700">
                  Enable FraudLabsPro Fraud Detection
                </Label>
              </div>

              {settings.fraudLabsPro?.enabled && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fraudlabs-api-key">API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="fraudlabs-api-key"
                        type={showKeys.fraudLabsPro ? "text" : "password"}
                        placeholder="Enter your FraudLabsPro API Key"
                        value={showKeys.fraudLabsPro ? (settings.fraudLabsPro?.apiKey || '') : maskApiKey(settings.fraudLabsPro?.apiKey || '')}
                        onChange={(e) => updateSetting("fraudLabsPro", "apiKey", e.target.value)}
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("fraudLabsPro")}>
                        {showKeys.fraudLabsPro ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Get your API key from <a href="https://www.fraudlabspro.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">fraudlabspro.com</a>
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="fraudlabs-min-amount">Minimum Amount to Check (£)</Label>
                    <Input
                      id="fraudlabs-min-amount"
                      type="number"
                      placeholder="100"
                      value={settings.fraudLabsPro?.minAmount || '05'}
                      onChange={(e) => updateSetting("fraudLabsPro", "minAmount", e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Only check payments above this amount for fraud. Enter 0 to check all payments.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="fraudlabs-action">Action on Fraud Detection</Label>
                    <Select
                      value={settings.fraudLabsPro?.action || 'block'}
                      onValueChange={(value) => updateSetting("fraudLabsPro", "action", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="block">Block Payment</SelectItem>
                        <SelectItem value="review">Manual Review Required</SelectItem>
                        <SelectItem value="allow">Allow with Warning</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose how to handle transactions flagged as fraudulent or suspicious.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="fraudlabs-failopen">On provider failure</Label>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="fraudlabs-failopen"
                        checked={settings.fraudLabsPro?.failOpen ?? true}
                        onCheckedChange={(checked) => updateSetting("fraudLabsPro", "failOpen", !!checked)}
                      />
                      <div className="text-sm text-gray-600">
                        Fail open on provider errors (allow payments when FraudLabsPro is unreachable).
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      If enabled, payments will continue when the fraud provider returns an error. Disable to block payments when provider failures occur.
                    </p>
                  </div>

                  <Button
                    onClick={() => testConnection("fraudLabsPro")}
                    disabled={testing.fraudLabsPro || !settings.fraudLabsPro?.apiKey}
                    variant="outline"
                    className="w-full"
                  >
                    {testing.fraudLabsPro ? (
                      <>
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        Test FraudLabsPro Connection
                      </>
                    )}
                  </Button>

                  {testResults.fraudLabsPro && (
                    <div
                      className={`p-3 rounded-lg border ${testResults.fraudLabsPro.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                    >
                      <div className="flex items-center space-x-2">
                        {testResults.fraudLabsPro.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        <span
                          className={`text-sm font-medium ${testResults.fraudLabsPro.success ? "text-green-800" : "text-red-800"}`}
                        >
                          {testResults.fraudLabsPro.message}
                        </span>
                        <span className="text-xs text-gray-500">({testResults.fraudLabsPro.timestamp})</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
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
