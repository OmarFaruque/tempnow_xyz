import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Eye, EyeOff, TestTube } from "lucide-react"

interface ResendSettingsTabProps {
  settings: any;
  updateSetting: (category: string, key: string, value: any) => void;
  showKeys: Record<string, boolean>;
  toggleKeyVisibility: (key: string) => void;
  testConnection: (service: string) => void;
  testing: Record<string, boolean>;
  maskApiKey: (key: string) => string;
}

export function ResendSettingsTab({
  settings,
  updateSetting,
  showKeys,
  toggleKeyVisibility,
  testConnection,
  testing,
  maskApiKey,
}: ResendSettingsTabProps) {
  return (
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
  )
}
