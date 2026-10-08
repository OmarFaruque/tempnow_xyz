import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Key, Info, Mail, Construction, Shield, Eye, EyeOff, TestTube, CheckCircle, AlertTriangle } from "lucide-react"
import { sanitizeHexColor } from "@/core/helpers"

interface GeneralSettingsTabProps {
  settings: any;
  updateSetting: (category: string, key: string, value: any) => void;
  showKeys: Record<string, boolean>;
  toggleKeyVisibility: (key: string) => void;
  testConnection: (service: string) => void;
  testing: Record<string, boolean>;
  testResults: Record<string, any>;
  maskApiKey: (key: string) => string;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingLogo: boolean;
  logoUploadError: string | null;
  handleFaviconUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingFavicon: boolean;
  faviconUploadError: string | null;
  handleLogoUploadUae: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingLogoUae: boolean;
  logoUploadErrorUae: string | null;
  handleFaviconUploadUae: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingFaviconUae: boolean;
  faviconUploadErrorUae: string | null;
}

export function GeneralSettingsTab({
  settings,
  updateSetting,
  showKeys,
  toggleKeyVisibility,
  testConnection,
  testing,
  testResults,
  maskApiKey,
  handleLogoUpload,
  uploadingLogo,
  logoUploadError,
  handleFaviconUpload,
  uploadingFavicon,
  faviconUploadError,
  handleLogoUploadUae,
  uploadingLogoUae,
  logoUploadErrorUae,
  handleFaviconUploadUae,
  uploadingFaviconUae,
  faviconUploadErrorUae,
}: GeneralSettingsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-gray-600" />
            General Settings
          </CardTitle>
          <CardDescription>Configure general application settings for UK and UAE (Dubai)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="border border-sky-200 rounded-xl overflow-hidden">
            <div className="bg-sky-50 px-5 py-4 border-b border-sky-200">
              <h3 className="text-sm font-semibold text-sky-900">SEO &amp; Social Metadata</h3>
              <p className="text-xs text-sky-700 mt-1">
                Shared values used for every website variation, search result, and social preview.
              </p>
            </div>
            <div className="p-5 space-y-4 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seo-title">Page Title</Label>
                  <Input
                    id="seo-title"
                    value={settings.general.seoTitle || ""}
                    onChange={(e) => updateSetting("general", "seoTitle", e.target.value)}
                    placeholder={settings.general.siteName || "Your application title"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo-canonical-url">Canonical URL</Label>
                  <Input
                    id="seo-canonical-url"
                    type="url"
                    value={settings.general.seoCanonicalUrl || ""}
                    onChange={(e) => updateSetting("general", "seoCanonicalUrl", e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo-description">Meta Description</Label>
                <Textarea
                  id="seo-description"
                  rows={3}
                  value={settings.general.seoDescription || ""}
                  onChange={(e) => updateSetting("general", "seoDescription", e.target.value)}
                  placeholder="A concise description of your application"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seo-keywords">Keywords</Label>
                  <Input
                    id="seo-keywords"
                    value={settings.general.seoKeywords || ""}
                    onChange={(e) => updateSetting("general", "seoKeywords", e.target.value)}
                    placeholder="temporary email, privacy, inbox"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seo-image">Social Preview Image URL</Label>
                  <Input
                    id="seo-image"
                    type="url"
                    value={settings.general.seoImage || ""}
                    onChange={(e) => updateSetting("general", "seoImage", e.target.value)}
                    placeholder="https://example.com/social-image.jpg"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={settings.general.seoIndex !== false}
                    onCheckedChange={(checked) => updateSetting("general", "seoIndex", checked === true)}
                  />
                  Allow search indexing
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={settings.general.seoFollow !== false}
                    onCheckedChange={(checked) => updateSetting("general", "seoFollow", checked === true)}
                  />
                  Allow search engines to follow links
                </label>
              </div>
            </div>
          </div>

          {/* Active Jurisdiction Selector */}
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Label htmlFor="active-jurisdiction" className="text-base font-semibold text-teal-900">
                Active Jurisdiction
              </Label>
              <p className="text-xs text-teal-700 mt-0.5">
                Select which jurisdiction's legal documents (Privacy Policy, Terms of Service, Return Policy) are active on the website.
              </p>
            </div>
            <Select
              value={settings.general.activeJurisdiction || "uk"}
              onValueChange={(value) => updateSetting("general", "activeJurisdiction", value)}
            >
              <SelectTrigger id="active-jurisdiction" className="w-48 bg-white border-teal-300 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uk">UK (United Kingdom)</SelectItem>
                <SelectItem value="uae">UAE (Dubai)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Announcement Popup Settings */}
          <div className="border border-indigo-200 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-4 border-b border-indigo-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                    <Info className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-indigo-900">Announcement Popup</h3>
                    <p className="text-xs text-indigo-600">Show a popup message to all website visitors</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={settings.general.popupEnabled ? "default" : "secondary"} className={settings.general.popupEnabled ? "bg-green-100 text-green-800 border-green-300" : ""}>
                    {settings.general.popupEnabled ? "Active" : "Inactive"}
                  </Badge>
                  <Switch
                    id="popup-enabled"
                    checked={!!settings.general.popupEnabled}
                    onCheckedChange={(checked) => updateSetting("general", "popupEnabled", checked)}
                  />
                </div>
              </div>
            </div>
            {settings.general.popupEnabled && (
              <div className="p-5 space-y-4 bg-white">
                <div className="space-y-2">
                  <Label htmlFor="popup-title" className="text-sm font-medium">Popup Title</Label>
                  <Input
                    id="popup-title"
                    value={settings.general.popupTitle || ""}
                    onChange={(e) => updateSetting("general", "popupTitle", e.target.value)}
                    placeholder="Announcement"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="popup-message" className="text-sm font-medium">Popup Message (HTML allowed)</Label>
                  <p className="text-xs text-gray-500">
                    Shown once per session — after closing, it won&apos;t reappear until the visitor opens a new browser session.
                  </p>
                  <Textarea
                    id="popup-message"
                    rows={5}
                    className="font-mono text-sm"
                    placeholder='<p>Welcome to our website! We have exciting news...</p>'
                    value={settings.general.popupMessage || ""}
                    onChange={(e) => updateSetting("general", "popupMessage", e.target.value)}
                  />
                </div>
                {settings.general.popupMessage && (
                  <div>
                    <Label className="text-xs text-gray-500">Preview:</Label>
                    <div className="mt-1 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                      <div dangerouslySetInnerHTML={{ __html: settings.general.popupMessage }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Email Branding
              </CardTitle>
              <CardDescription>
                One brand color for every email this site sends — headers, buttons and links.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-md">
                <Label htmlFor="brand-color">Brand Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="brand-color"
                    type="color"
                    value={sanitizeHexColor(settings.general.brandColor, "#0d9488")}
                    onChange={(e) => updateSetting("general", "brandColor", e.target.value)}
                    className="h-10 w-14 cursor-pointer p-1"
                  />
                  <Input
                    type="text"
                    value={settings.general.brandColor || ""}
                    onChange={(e) => updateSetting("general", "brandColor", e.target.value)}
                    placeholder="#0d9488"
                    className="font-mono"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Applies to all transactional emails (orders, tickets, verification codes, …) — give each site its own brand color. Site name, logo and company details come from the settings below.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sub-tabs for UK vs UAE values */}
          <Tabs defaultValue="uk" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="uk" className="font-semibold">UK Settings</TabsTrigger>
              <TabsTrigger value="uae" className="font-semibold">UAE (Dubai) Settings</TabsTrigger>
            </TabsList>

            {/* UK Tab Content */}
            <TabsContent value="uk" className="space-y-8">
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
                      <SelectItem value="AED">AED (د.إ)</SelectItem>
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
                  <Label htmlFor="site-domain">Site Domain</Label>
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
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="space-y-2">
                      <Label className="text-sm">Use Specific Redirect Path</Label>
                      <Select
                        value={settings.general?.useSpecificRedirectPath ? "yes" : "no"}
                        onValueChange={(value) => updateSetting("general", "useSpecificRedirectPath", value === "yes")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="redirectUrl">Redirect URL</Label>
                    <Input
                      id="redirectUrl"
                      type={settings.general?.useSpecificRedirectPath ? "text" : "url"}
                      value={settings.general?.redirectUrl}
                      onChange={(e) => updateSetting("general", "redirectUrl", e.target.value)}
                      placeholder="Enter redirect URL"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aiName">AI Assistant Name</Label>
                  <Input
                    id="aiName"
                    value={settings.general.aiName || ""}
                    onChange={(e) => updateSetting("general", "aiName", e.target.value)}
                    placeholder="e.g. Cryle AI (Default: Lettie)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aiSlug">AI Subpath Slug</Label>
                  <Input
                    id="aiSlug"
                    value={settings.general.aiSlug || ""}
                    onChange={(e) => updateSetting("general", "aiSlug", e.target.value)}
                    placeholder="e.g. cryle-ai (Default: ai-documents)"
                  />
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
                  <Label>Site Logo (UK)</Label>
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
                  <Label>Favicon (UK)</Label>
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
            </TabsContent>

            {/* UAE Tab Content */}
            <TabsContent value="uae" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="site-name-uae">Site Name (UAE)</Label>
                  <Input
                    id="site-name-uae"
                    value={settings.general_uae?.siteName || ""}
                    onChange={(e) => updateSetting("general_uae", "siteName", e.target.value)}
                    placeholder="e.g. MONZIC UAE"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency-uae">Currency (UAE)</Label>
                  <Select
                    value={settings.general_uae?.currency || "AED"}
                    onValueChange={(value) => updateSetting("general_uae", "currency", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AED">AED (د.إ)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-email-uae">Support Email (UAE)</Label>
                  <Input
                    id="support-email-uae"
                    type="email"
                    value={settings.general_uae?.supportEmail || ""}
                    onChange={(e) => updateSetting("general_uae", "supportEmail", e.target.value)}
                    placeholder="e.g. support@tempnow.ae"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email-uae">Admin Email (UAE)</Label>
                  <Input
                    id="admin-email-uae"
                    type="email"
                    value={settings.general_uae?.adminEmail || ""}
                    onChange={(e) => updateSetting("general_uae", "adminEmail", e.target.value)}
                    placeholder="e.g. admin@tempnow.ae"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site-domain-uae">Site Domain (UAE)</Label>
                  <Input
                    id="site-domain-uae"
                    type="text"
                    value={settings.general_uae?.siteDomain || ""}
                    onChange={(e) => updateSetting("general_uae", "siteDomain", e.target.value)}
                    placeholder="e.g. tempnow.ae"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-name-uae">Company Name (UAE)</Label>
                  <Input
                    id="company-name-uae"
                    type="text"
                    value={settings.general_uae?.companyName || ""}
                    onChange={(e) => updateSetting("general_uae", "companyName", e.target.value)}
                    placeholder="e.g. SBR Digital"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-registration-uae">Company Registration / Licence No. (UAE)</Label>
                  <Input
                    id="company-registration-uae"
                    type="text"
                    value={settings.general_uae?.companyRegistration || ""}
                    onChange={(e) => updateSetting("general_uae", "companyRegistration", e.target.value)}
                    placeholder="e.g. Licence No. 123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="effective-date-uae">Effective Date (UAE)</Label>
                  <Input
                    id="effective-date-uae"
                    type="date"
                    value={settings.general_uae?.effectiveDate || ""}
                    onChange={(e) => updateSetting("general_uae", "effectiveDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aliases-uae">Aliases (UAE)</Label>
                  <Input
                    id="aliases-uae"
                    type="text"
                    value={settings.general_uae?.aliases || ""}
                    onChange={(e) => updateSetting("general_uae", "aliases", e.target.value)}
                    placeholder="e.g. Tempnow UAE"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessActivity-uae">Business Activity (UAE)</Label>
                  <Input
                    id="businessActivity-uae"
                    type="text"
                    value={settings.general_uae?.businessActivity || ""}
                    onChange={(e) => updateSetting("general_uae", "businessActivity", e.target.value)}
                    placeholder="e.g. E-Commerce Services"
                  />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Use Specific Redirect Path (UAE)</Label>
                      <Select
                        value={settings.general_uae?.useSpecificRedirectPath ? "yes" : "no"}
                        onValueChange={(value) => updateSetting("general_uae", "useSpecificRedirectPath", value === "yes")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="activeRedirection-uae">Active Redirection (UAE)</Label>
                      <Select
                        value={settings.general_uae?.activeRedirection || "0"}
                        onValueChange={(value) => updateSetting("general_uae", "activeRedirection", value)}
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="redirectUrl-uae">Redirect URL (UAE)</Label>
                    <Input
                      id="redirectUrl-uae"
                      type={settings.general_uae?.useSpecificRedirectPath ? "text" : "url"}
                      value={settings.general_uae?.redirectUrl || ""}
                      onChange={(e) => updateSetting("general_uae", "redirectUrl", e.target.value)}
                      placeholder="Enter redirect URL"
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="checkout-checkbox-content-uae">Checkout Checkbox Content (UAE)</Label>
                  <Textarea
                    id="checkout-checkbox-content-uae"
                    value={settings.general_uae?.checkoutCheckboxContent || ""}
                    onChange={(e) => updateSetting("general_uae", "checkoutCheckboxContent", e.target.value)}
                    placeholder="Enter UAE checkbox content. Separate multiple checkboxes with ||"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500">
                    Use || to separate multiple checkboxes. You can use HTML for links, e.g., &lt;a href="/terms"&gt;Terms&lt;/a&gt;.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                <div className="space-y-2">
                  <Label>Site Logo (UAE)</Label>
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="w-24 h-24 rounded-md flex items-center justify-center bg-gray-50 overflow-hidden">
                      {settings.general_uae?.logo ? (
                        <img src={settings.general_uae.logo} alt="UAE Logo Preview" className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-xs text-gray-500">No Logo</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        id="logo-upload-uae"
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml"
                        onChange={handleLogoUploadUae}
                        className="hidden"
                      />
                      <Button asChild variant="outline">
                        <label htmlFor="logo-upload-uae" className="cursor-pointer w-full flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          {uploadingLogoUae ? "Uploading..." : "Upload Logo"}
                        </label>
                      </Button>
                      <p className="text-xs text-gray-500">PNG, JPG, SVG. Max 2MB.</p>
                      {logoUploadErrorUae && <p className="text-sm text-red-500 mt-1">{logoUploadErrorUae}</p>}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Favicon (UAE)</Label>
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="w-24 h-24 rounded-md flex items-center justify-center bg-gray-50 overflow-hidden">
                      {settings.general_uae?.favicon ? (
                        <img src={settings.general_uae.favicon} alt="UAE Favicon Preview" className="h-16 w-16 object-contain" />
                      ) : (
                        <span className="text-xs text-gray-500">No Favicon</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input id="favicon-upload-uae" type="file" accept=".jpg, image/x-icon, image/png, image/jpeg, image/svg+xml" onChange={handleFaviconUploadUae} className="hidden" />
                      <Button asChild variant="outline">
                        <label htmlFor="favicon-upload-uae" className="cursor-pointer w-full flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                          {uploadingFaviconUae ? "Uploading..." : "Upload Favicon"}
                        </label>
                      </Button>
                      <p className="text-xs text-gray-500">ICO, PNG, SVG. Recommended: 32x32px.</p>
                      {faviconUploadErrorUae && <p className="text-sm text-red-500 mt-1">{faviconUploadErrorUae}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-4 pt-6 border-t">
            <h4 className="text-lg font-medium">Shared MOT & Vehicle API Keys</h4>
            <p className="text-sm text-gray-500">
              These credentials are shared across both UK and UAE settings.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="mot_api_key">MOT API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="mot_api_key"
                    type={showKeys.motApiKey ? "text" : "password"}
                    value={showKeys.motApiKey ? settings.motApi.mot_api_key : maskApiKey(settings.motApi.mot_api_key)}
                    onChange={(e) => updateSetting("motApi", "mot_api_key", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("motApiKey")}>
                    {showKeys.motApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="check_car_details_api_key">Check Car Details API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="check_car_details_api_key"
                    type={showKeys.checkCarDetailsApiKey ? "text" : "password"}
                    value={showKeys.checkCarDetailsApiKey ? settings.motApi.check_car_details_api_key : maskApiKey(settings.motApi.check_car_details_api_key)}
                    onChange={(e) => updateSetting("motApi", "check_car_details_api_key", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("checkCarDetailsApiKey")}>
                    {showKeys.checkCarDetailsApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mot_client_id">MOT Client ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="mot_client_id"
                    type={showKeys.motClientID ? "text" : "password"}
                    value={showKeys.motClientID ? settings.motApi.mot_client_id : maskApiKey(settings.motApi.mot_client_id)}
                    onChange={(e) => updateSetting("motApi", "mot_client_id", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("motClientID")}>
                    {showKeys.motClientID ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mot_client_secret">MOT Client Secret</Label>
                <div className="flex gap-2">
                  <Input
                    id="mot_client_secret"
                    type={showKeys.motClientSecret ? "text" : "password"}
                    value={showKeys.motClientSecret ? settings.motApi.mot_client_secret : maskApiKey(settings.motApi.mot_client_secret)}
                    onChange={(e) => updateSetting("motApi", "mot_client_secret", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("motClientSecret")}>
                    {showKeys.motClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mot_scope_url">MOT Scope URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="mot_scope_url"
                    type={showKeys.motScopeUrl ? "text" : "password"}
                    value={showKeys.motScopeUrl ? settings.motApi.mot_scope_url : maskApiKey(settings.motApi.mot_scope_url)}
                    onChange={(e) => updateSetting("motApi", "mot_scope_url", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("motScopeUrl")}>
                    {showKeys.motScopeUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mot_token_url">MOT Token URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="mot_token_url"
                    type={showKeys.motTokenUrl ? "text" : "password"}
                    value={showKeys.motTokenUrl ? settings.motApi.mot_token_url : maskApiKey(settings.motApi.mot_token_url)}
                    onChange={(e) => updateSetting("motApi", "mot_token_url", e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => toggleKeyVisibility("motTokenUrl")}>
                    {showKeys.motTokenUrl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
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
            <Construction className="h-5 w-5 text-amber-600" />
            Maintenance Mode
          </CardTitle>
          <CardDescription>Temporarily pause customer access to the frontend while keeping the admin area available</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-teal-50 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                  <Construction className="h-4 w-4" />
                  Maintenance gate
                </div>
                <p className="text-sm text-slate-600">
                  When enabled, visitors are shown a dedicated maintenance page on all public routes. Admin access at /administrator remains available.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-full border border-amber-200 bg-white px-4 py-2 shadow-sm">
                <span className={`text-sm font-medium ${settings.maintenance.enabled ? "text-emerald-700" : "text-slate-500"}`}>
                  {settings.maintenance.enabled ? "Active" : "Inactive"}
                </span>
                <Switch
                  checked={settings.maintenance.enabled}
                  onCheckedChange={(checked) => updateSetting("maintenance", "enabled", checked)}
                  aria-label="Toggle maintenance mode"
                />
              </div>
            </div>
          </div>

          {settings.maintenance.enabled && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="maintenance-title">Maintenance Title</Label>
                <Input
                  id="maintenance-title"
                  value={settings.maintenance.title}
                  onChange={(e) => updateSetting("maintenance", "title", e.target.value)}
                  placeholder="We’ll be back shortly"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="maintenance-message">Maintenance Message</Label>
                <Textarea
                  id="maintenance-message"
                  value={settings.maintenance.message}
                  onChange={(e) => updateSetting("maintenance", "message", e.target.value)}
                  placeholder="Share what is happening and when visitors should return."
                  rows={5}
                />
              </div>
              <div className="space-y-2 md:max-w-sm">
                <Label htmlFor="maintenance-available-date">Website Available Date</Label>
                <Input
                  id="maintenance-available-date"
                  type="datetime-local"
                  value={settings.maintenance.availableDate}
                  onChange={(e) => updateSetting("maintenance", "availableDate", e.target.value)}
                />
              </div>
            </div>
          )}
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
    </div>
  )
}
