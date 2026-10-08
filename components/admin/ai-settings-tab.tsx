import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Brain, Eye, EyeOff, TestTube } from "lucide-react"

interface AISettingsTabProps {
  settings: any;
  updateSetting: (category: string, key: string, value: any) => void;
  showKeys: Record<string, boolean>;
  toggleKeyVisibility: (key: string) => void;
  testConnection: (service: string) => void;
  testing: Record<string, boolean>;
  maskApiKey: (key: string) => string;
}

export function AISettingsTab({
  settings,
  updateSetting,
  showKeys,
  toggleKeyVisibility,
  testConnection,
  testing,
  maskApiKey,
}: AISettingsTabProps) {
  return (
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
  )
}
