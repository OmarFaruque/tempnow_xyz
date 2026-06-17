"use client"

import { useState } from "react"
import { Calculator, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { calculateQuote } from "@/lib/quote";

export function QuoteFormulaSettings({ settings, updateSetting }) {
  // The state for the test calculator will be local to this component
  const [testAge, setTestAge] = useState("")
  const [testLicenseRange, setTestLicenseRange] = useState("")
  const [testCoverType, setTestCoverType] = useState<"hours" | "days" | "weeks">("hours")
  const [testCoverAmount, setTestCoverAmount] = useState("")
  const [testResult, setTestResult] = useState<number | null>(null)
  const [testBreakdown, setTestBreakdown] = useState<{
    basePrice: number
    ageDiscount: number
    licenseDiscount: number
    finalPrice: number
  } | null>(null)

  const quoteFormula = settings || {}
  const ageDiscountRanges = quoteFormula.ageDiscountRanges || []
  const licenseDiscounts = quoteFormula.licenseDiscounts || [
    { range: "Under 1 Year", discount: "0" },
    { range: "1-2 Years", discount: "7" },
    { range: "2-4 Years", discount: "10" },
    { range: "5-10 Years", discount: "13" },
    { range: "10+ Years", discount: "15" },
  ]


// ...

  const runTest = () => {
    const amount = Number.parseFloat(testCoverAmount)
    const age = Number.parseFloat(testAge)

    if (isNaN(amount) || isNaN(age) || !testLicenseRange) {
      return
    }

    const testFormData = {
        duration: `${testCoverAmount} ${testCoverType}`,
        durationType: testCoverType.charAt(0).toUpperCase() + testCoverType.slice(1),
        dateOfBirthYear: (new Date().getFullYear() - age).toString(),
        licenseHeld: testLicenseRange,
    }

    const result = calculateQuote(quoteFormula, testFormData);

    if (result) {
        setTestResult(result.total);
        setTestBreakdown({
            basePrice: result.basePrice,
            ageDiscount: result.ageDiscountAmount,
            licenseDiscount: result.licenseDiscountAmount,
            finalPrice: result.total,
        });
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card px-6 py-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-card-foreground">Quote Formula Calculator</h1>
            <p className="text-sm text-muted-foreground">Configure pricing and test calculations</p>
          </div>
        </div>
      </div>

      {/* Base Prices Section */}
      <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="h-1 bg-gradient-to-r from-primary/80 to-primary" />
        <div className="border-b border-border bg-muted px-6 py-4">
          <h2 className="text-sm font-semibold text-card-foreground">Base Prices</h2>
        </div>
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Base Hour Rate (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={quoteFormula.baseHourRate ?? ""}
                onChange={(e) => updateSetting("quoteFormula", "baseHourRate", Number(e.target.value))}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Additional Hour Rate {"<24hrs"} (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={quoteFormula.baseAdditionalHourRate ?? ""}
                onChange={(e) => updateSetting("quoteFormula", "baseAdditionalHourRate", Number(e.target.value))}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Base Day Rate (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={quoteFormula.baseDayRate ?? ""}
                onChange={(e) => updateSetting("quoteFormula", "baseDayRate", Number(e.target.value))}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Additional Day Rate (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={quoteFormula.baseAdditionalDayRate ?? ""}
                onChange={(e) => updateSetting("quoteFormula", "baseAdditionalDayRate", Number(e.target.value))}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Base Week Rate (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={quoteFormula.baseWeekRate ?? ""}
                onChange={(e) => updateSetting("quoteFormula", "baseWeekRate", Number(e.target.value))}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Additional Week Rate (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={quoteFormula.baseAdditionalWeekRate ?? ""}
                onChange={(e) => updateSetting("quoteFormula", "baseAdditionalWeekRate", Number(e.target.value))}
                className="h-10"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium text-foreground">Base 4 Week Rate (£)</Label>
              <Input
                type="number"
                step="0.01"
                value={quoteFormula.baseFourWeekRate ?? ""}
                onChange={(e) => updateSetting("quoteFormula", "baseFourWeekRate", Number(e.target.value))}
                className="h-10"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Minimum Rates Section */}
      <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="h-1 bg-gradient-to-r from-amber-500/80 to-amber-500" />
        <div className="border-b border-border bg-muted px-6 py-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-card-foreground">Minimum Rates (Price Floor)</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Prevent quotes from falling below specified amounts after applying discounts
          </p>
        </div>
        <div className="space-y-6 p-6">
          {/* Enable Minimum Rates Checkbox */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <Checkbox
              id="enable-min-rates"
              checked={quoteFormula.enableMinimumRates ?? false}
              onCheckedChange={(checked) => updateSetting("quoteFormula", "enableMinimumRates", checked)}
              className="h-5 w-5"
            />
            <Label htmlFor="enable-min-rates" className="cursor-pointer flex-1 text-sm font-medium text-foreground">
              Enable Minimum Rates
            </Label>
            <span className="text-xs text-muted-foreground">
              {quoteFormula.enableMinimumRates ? "Active" : "Inactive"}
            </span>
          </div>

          {/* Minimum Rates Inputs */}
          {quoteFormula.enableMinimumRates && (
            <div className="space-y-4 rounded-lg border border-amber-200/30 bg-amber-50/50 p-4">
              <p className="text-xs font-medium text-amber-900/70">
                Set minimum prices to ensure quotes don&apos;t drop below these amounts after discounts are applied.
              </p>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Base Minimum Rates</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Minimum Base Hour Rate (£)</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        £
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={quoteFormula.minimumHourRate ?? ""}
                        onChange={(e) => updateSetting("quoteFormula", "minimumHourRate", Number(e.target.value) || null)}
                        placeholder="0.00"
                        className="h-10 pl-7"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Minimum Base Day Rate (£)</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        £
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={quoteFormula.minimumDayRate ?? ""}
                        onChange={(e) => updateSetting("quoteFormula", "minimumDayRate", Number(e.target.value) || null)}
                        placeholder="0.00"
                        className="h-10 pl-7"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Minimum Base Week Rate (£)</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        £
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={quoteFormula.minimumWeekRate ?? ""}
                        onChange={(e) => updateSetting("quoteFormula", "minimumWeekRate", Number(e.target.value) || null)}
                        placeholder="0.00"
                        className="h-10 pl-7"
                      />
                    </div>
                  </div>


                  <div className="space-y-2 md:col-span-3">
                    <Label className="text-sm font-medium text-foreground">Minimum Base 4 Week Rate (£)</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        £
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={quoteFormula.minimumFourWeekRate ?? ""}
                        onChange={(e) =>
                          updateSetting("quoteFormula", "minimumFourWeekRate", Number(e.target.value) || null)
                        }
                        placeholder="0.00"
                        className="h-10 pl-7"
                      />
                    </div>
                  </div>
                  
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">Additional Minimum Rates</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Min Additional Hour Rate (£)</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        £
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={quoteFormula.minimumAdditionalHourRate ?? ""}
                        onChange={(e) =>
                          updateSetting("quoteFormula", "minimumAdditionalHourRate", Number(e.target.value) || null)
                        }
                        placeholder="0.00"
                        className="h-10 pl-7"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Min Additional Day Rate (£)</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        £
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={quoteFormula.minimumAdditionalDayRate ?? ""}
                        onChange={(e) =>
                          updateSetting("quoteFormula", "minimumAdditionalDayRate", Number(e.target.value) || null)
                        }
                        placeholder="0.00"
                        className="h-10 pl-7"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Min Additional Week Rate (£)</Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                        £
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={quoteFormula.minimumAdditionalWeekRate ?? ""}
                        onChange={(e) =>
                          updateSetting("quoteFormula", "minimumAdditionalWeekRate", Number(e.target.value) || null)
                        }
                        placeholder="0.00"
                        className="h-10 pl-7"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50/50 p-3 text-xs text-blue-900/70">
                <p className="font-medium">💡 Example:</p>
                <p>
                  If the calculated price after all discounts is £15, but your minimum hour rate is £25, the quote will
                  be set to £25.
                </p>
              </div>
            </div>
          )}

          {!quoteFormula.enableMinimumRates && (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-4 text-center">
              <p className="text-sm text-muted-foreground">Enable minimum rates to set price floors for your quotes</p>
            </div>
          )}
        </div>
      </Card>

      {/* Discount Configuration Section */}
      <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="h-1 bg-gradient-to-r from-primary/80 to-primary" />
        <div className="border-b border-border bg-muted px-6 py-4">
          <h2 className="text-sm font-semibold text-card-foreground">Discount Configuration</h2>
        </div>
        <div className="space-y-6 p-6">
          {/* Age Discount Ranges */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-foreground">Age Discount Ranges</Label>
              <Button
                onClick={() => {
                  const newRanges = [...ageDiscountRanges, { minAge: "", maxAge: "", multiplier: "" }]
                  updateSetting("quoteFormula", "ageDiscountRanges", newRanges)
                }}
                variant="outline"
                size="sm"
              >
                Add Range
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Formula: (age - 17) × multiplier = discount amount in £</p>
            {ageDiscountRanges.map((range, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Min Age"
                    value={range.minAge}
                    onChange={(e) => {
                      const updatedRanges = [...ageDiscountRanges]
                      updatedRanges[index].minAge = e.target.value
                      updateSetting("quoteFormula", "ageDiscountRanges", updatedRanges)
                    }}
                    className="h-10"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Max Age"
                    value={range.maxAge}
                    onChange={(e) => {
                      const updatedRanges = [...ageDiscountRanges]
                      updatedRanges[index].maxAge = e.target.value
                      updateSetting("quoteFormula", "ageDiscountRanges", updatedRanges)
                    }}
                    className="h-10"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Multiplier"
                    value={range.multiplier}
                    onChange={(e) => {
                      const updatedRanges = [...ageDiscountRanges]
                      updatedRanges[index].multiplier = e.target.value
                      updateSetting("quoteFormula", "ageDiscountRanges", updatedRanges)
                    }}
                    className="h-10"
                  />
                </div>
                <Button
                  onClick={() => {
                    const newRanges = ageDiscountRanges.filter((_, i) => i !== index)
                    updateSetting("quoteFormula", "ageDiscountRanges", newRanges)
                  }}
                  variant="ghost"
                  size="icon"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>

          <Separator />

          {/* License Length Discounts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-foreground">License Length Discounts (%)</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure discount percentages for each license length range
            </p>
            {licenseDiscounts.map((discount, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex h-10 items-center rounded-lg border border-input bg-muted px-3 text-sm font-medium">
                    {discount.range}
                  </div>
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Discount %"
                    value={discount.discount}
                    onChange={(e) => {
                      const updatedDiscounts = [...licenseDiscounts]
                      updatedDiscounts[index].discount = e.target.value
                      updateSetting("quoteFormula", "licenseDiscounts", updatedDiscounts)
                    }}
                    className="h-10"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Test Calculator Section */}
      <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="h-1 bg-gradient-to-r from-primary/80 to-primary" />
        <div className="border-b border-border bg-muted px-6 py-4">
          <h2 className="text-sm font-semibold text-card-foreground">Test Calculator</h2>
        </div>
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Age</Label>
              <Input
                type="number"
                placeholder="e.g. 25"
                value={testAge}
                onChange={(e) => setTestAge(e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">License Length</Label>
              <Select value={testLicenseRange} onValueChange={setTestLicenseRange}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select duration..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Under 1 Year">Under 1 Year</SelectItem>
                  <SelectItem value="1-2 Years">1-2 Years</SelectItem>
                  <SelectItem value="2-4 Years">2-4 Years</SelectItem>
                  <SelectItem value="5-10 Years">5-10 Years</SelectItem>
                  <SelectItem value="10+ Years">10+ Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Cover Type</Label>
              <Select value={testCoverType} onValueChange={(value: any) => setTestCoverType(value)}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Hours</SelectItem>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Amount ({testCoverType === "hours" ? "hours" : testCoverType === "days" ? "days" : "weeks"})
              </Label>
              <Input
                type="number"
                placeholder="e.g. 1"
                value={testCoverAmount}
                onChange={(e) => setTestCoverAmount(e.target.value)}
                className="h-10"
                min="1"
              />
            </div>
          </div>

          <Button
            onClick={runTest}
            className="h-12 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
            disabled={!testAge || !testLicenseRange || !testCoverAmount}
          >
            <Calculator className="mr-2 h-5 w-5" />
            Calculate Test Price
          </Button>

          {testResult !== null && testBreakdown && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Price:</span>
                    <span className="font-medium text-foreground">£{testBreakdown.basePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Age Discount:</span>
                    <span className="font-medium text-green-600">-£{testBreakdown.ageDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License Length Discount:</span>
                    <span className="font-medium text-green-600">-£{testBreakdown.licenseDiscount.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-base font-semibold">
                    <span className="text-foreground">Total:</span>
                    <span className="text-primary">£{testBreakdown.finalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 text-center animate-in fade-in duration-500">
                <div className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Calculated Price
                </div>
                <div className="text-5xl font-bold text-primary">£{testResult.toFixed(2)}</div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Based on {testCoverAmount} {testCoverType}, age {testAge}, license held{" "}
                  {testLicenseRange.toLowerCase()}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
