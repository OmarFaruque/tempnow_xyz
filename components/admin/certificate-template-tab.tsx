"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"


import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Upload } from "lucide-react"

export function CertificateTemplateTab({ settings, updateSetting }: { settings: any; updateSetting: any }) {
  const template = settings.certificateTemplate || {}
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const handleTemplateChange = (part: string, value: string) => {
    updateSetting("certificateTemplate", part, value)
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("/api/admin/upload-logo", {
        method: "POST",
        body: formData,
      })
      const result = await response.json()
      if (result.success) {
        handleTemplateChange("logo", result.url)
      } else {
        console.error("Logo upload failed:", result.error)
      }
    } catch (error) {
      console.error("Error uploading logo:", error)
    } finally {
      setUploadingLogo(false)
    }
  }

  const availableVariables = [
    "docNumber",
    "registrationMark",
    "descriptionOfVehicles",
    "make",
    "model",
    "name",
    "dob",
    "license",
    "effectiveDate",
    "expiryDate",
    "address",
    "premium",
    "excess",
  ]

  const insertVariable = (part: keyof typeof template, variable: string) => {
    const currentContent = template[part] || ""
    const textarea = document.getElementById(`cert-${part}`) as HTMLTextAreaElement

    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = currentContent.substring(0, start) + `{{${variable}}}` + currentContent.substring(end)
      handleTemplateChange(part, newContent)

      setTimeout(() => {
        textarea.focus()
        textarea.selectionStart = start + variable.length + 4
        textarea.selectionEnd = start + variable.length + 4
      }, 0)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Certificate Template
        </CardTitle>
        <CardDescription>
          Customize the content of the generated Certificate PDF. Use the available variables to dynamically
          insert policy data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Template Logo</Label>
          <div className="flex items-center gap-4 mt-2">
            {template.logo ? (
              <img src={template.logo} alt="Current logo" className="h-16 w-auto rounded-md border p-1" />
            ) : (
              <div className="h-16 w-32 flex items-center justify-center bg-gray-100 rounded-md text-sm text-gray-500">
                No Logo
              </div>
            )}
            <Input id="sof-logo-upload" type="file" onChange={handleLogoUpload} className="hidden" accept="image/*" />
            <Button asChild variant="outline">
              <Label htmlFor="sof-logo-upload" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                {uploadingLogo ? "Uploading..." : "Upload Logo"}
              </Label>
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Upload a specific logo for this document. If no logo is uploaded, the default system logo will be used.
          </p>
        </div>
        <div>
          <Label htmlFor="cert-page1">Page 1 Content (HTML)</Label>
          <Textarea
            id="cert-page1"
            value={template.page1 || ""}
            onChange={(e) => handleTemplateChange("page1", e.target.value)}
            rows={20}
            className="font-mono text-sm"
          />
        </div>
        <div>
          <Label htmlFor="cert-page1_footer">Page 1 Footer (HTML)</Label>
          <Textarea
            id="cert-page1_footer"
            value={template.page1_footer || ""}
            onChange={(e) => handleTemplateChange("page1_footer", e.target.value)}
            rows={10}
            className="font-mono text-sm"
          />
        </div>
        <div>
          <Label htmlFor="cert-page2">Page 2 Content (HTML)</Label>
          <Textarea
            id="cert-page2"
            value={template.page2 || ""}
            onChange={(e) => handleTemplateChange("page2", e.target.value)}
            rows={20}
            className="font-mono text-sm"
          />
        </div>
        <div>
          <Label>Available Variables</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {availableVariables.map((variable) => (
              <Badge
                key={variable}
                variant="outline"
                className="cursor-pointer hover:bg-blue-50"
                onClick={() => {
                  const activeElementId = document.activeElement?.id
                  if (activeElementId && activeElementId.startsWith("cert-")) {
                    const part = activeElementId.replace("cert-", "")
                    insertVariable(part as keyof typeof template, variable)
                  }
                }}
              >
                {`{{${variable}}}`}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Click inside a text area, then click a variable to insert it at your cursor&apos;s position.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
