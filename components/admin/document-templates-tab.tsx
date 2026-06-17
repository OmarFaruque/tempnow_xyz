import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText } from "lucide-react"
import { CertificateTemplateTab } from "./certificate-template-tab"
import { StatementOfFactTemplateTab } from "./statement-of-fact-template-tab"
import { PolicyScheduleTemplateTab } from "./policy-schedule-template-tab"

export function DocumentTemplatesTab({ settings, updateSetting }: { settings: any; updateSetting: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-600" />
          Document Templates
        </CardTitle>
        <CardDescription>
          Customize the content of all customer-facing PDF documents. Use the available variables to dynamically
          insert data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="certificate" className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
          <TabsList className="flex flex-col h-full bg-gray-100 p-2 rounded-lg">
            <TabsTrigger value="certificate" className="w-full justify-start py-2 px-4 text-left">
              Certificate
            </TabsTrigger>
            <TabsTrigger value="statement_of_fact" className="w-full justify-start py-2 px-4 text-left">
              Statement of Fact
            </TabsTrigger>
            <TabsTrigger value="policy_schedule" className="w-full justify-start py-2 px-4 text-left">
              Document Schedule
            </TabsTrigger>
            {/* Add future document triggers here */}
          </TabsList>

          <div className="md:col-start-2">
            <TabsContent value="certificate">
              <CertificateTemplateTab settings={settings} updateSetting={updateSetting} />
            </TabsContent>
            <TabsContent value="statement_of_fact">
              <StatementOfFactTemplateTab settings={settings} updateSetting={updateSetting} />
            </TabsContent>
            <TabsContent value="policy_schedule">
              <PolicyScheduleTemplateTab settings={settings} updateSetting={updateSetting} />
            </TabsContent>
            {/* Add future document content here */}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
