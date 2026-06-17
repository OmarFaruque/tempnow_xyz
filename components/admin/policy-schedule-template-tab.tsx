"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Upload } from "lucide-react"

export function PolicyScheduleTemplateTab({ settings, updateSetting }: { settings: any; updateSetting: any }) {
  const template = settings.policyScheduleTemplate || {}
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const handleTemplateChange = (part: string, value: string) => {
    updateSetting("policyScheduleTemplate", part, value)
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
    "policy_number",
    "startDate",
    "startTime",
    "endDate",
    "endTime",
    "name_title",
    "first_name",
    "last_name",
    "dateOfBirth",
    "address",
    "postcode",
    "firstPart", // address line 1
    "lastPart", // address line 2
    "cover_reason",
    "premium",
    "reg_number",
    "vehicle_value",
    "vehicle_name",
    "vehicle_model",
  ]

  const insertVariable = (part: keyof typeof template, variable: string) => {
    const currentContent = template[part] || ""
    const textarea = document.getElementById(`ps-${part}`) as HTMLTextAreaElement

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
          <FileText className="h-5 w-5 text-green-600" />
          Policy Schedule Template
        </CardTitle>
        <CardDescription>
          Customize the content of the generated Policy Schedule PDF. Use the available variables to dynamically
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
            <Input id="ps-logo-upload" type="file" onChange={handleLogoUpload} className="hidden" accept="image/*" />
            <Button asChild variant="outline">
              <Label htmlFor="ps-logo-upload" className="cursor-pointer">
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
          <Label htmlFor="ps-endorsementsApplicable">Endorsements Applicable (HTML)</Label>
          <Textarea
            id="ps-endorsementsApplicable"
            value={template.endorsementsApplicable || ""}
            onChange={(e) => handleTemplateChange("endorsementsApplicable", e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />
        </div>
        <div>
          <Label htmlFor="ps-endorsements">Endorsements (HTML)</Label>
          <Textarea
            id="ps-endorsements"
            value={template.endorsements || ""}
            onChange={(e) => handleTemplateChange("endorsements", e.target.value)}
            rows={12}
            className="font-mono text-sm"
          />
        </div>
        <div>
          <Label htmlFor="ps-importantInformation">Important Information (HTML)</Label>
          <Textarea
            id="ps-importantInformation"
            value={template.importantInformation || ""}
            onChange={(e) => handleTemplateChange("importantInformation", e.target.value)}
            rows={12}
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
                className="cursor-pointer hover:bg-green-50"
                onClick={() => {
                  const activeElementId = document.activeElement?.id
                  if (activeElementId && activeElementId.startsWith("ps-")) {
                    const part = activeElementId.replace("ps-", "")
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
