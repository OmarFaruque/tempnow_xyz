"use client"

import { useState } from "react"
import { ArrowLeft, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export default function QuoteFormulaPage() {
  const [baseHourRate, setBaseHourRate] = useState("12.56")
  const [baseAdditionalHourRate, setBaseAdditionalHourRate] = useState("0.41")
  const [baseDayRate, setBaseDayRate] = useState("22.11")
  const [baseAdditionalDayRate, setBaseAdditionalDayRate] = useState("15.025") // Updated default additional day rate to 15.025
  const [baseWeekRate, setBaseWeekRate] = useState("112.26")
  const [baseAdditionalWeekRate, setBaseAdditionalWeekRate] = useState("78.22") // Updated default additional week rate to 78.22
  const [baseFourWeekRate, setBaseFourWeekRate] = useState("346.92")

  const [ageDiscountRanges, setAgeDiscountRanges] = useState<{ minAge: string; maxAge: string; multiplier: string }[]>([
    { minAge: "18", maxAge: "20", multiplier: "0.1" },
    { minAge: "21", maxAge: "23", multiplier: "0.3" },
    { minAge: "24", maxAge: "26", multiplier: "0.4" },
    { minAge: "27", maxAge: "80", multiplier: "0.6" },
  ])

  const [licenseDiscounts, setLicenseDiscounts] = useState<{ range: string; discount: string }[]>([
    { range: "Under 1 Year", discount: "0" },
    { range: "1-2 Years", discount: "7" },
    { range: "2-4 Years", discount: "10" },
    { range: "5-10 Years", discount: "13" },
    { range: "10+ Years", discount: "15" },
  ])

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

  const calculateBasePrice = (type: "hours" | "days" | "weeks", amount: number): number => {
    if (type === "hours") {
      if (amount === 1) {
        return Number.parseFloat(baseHourRate)
      } else if (amount < 24) {
        return Number.parseFloat(baseHourRate) + (amount - 1) * Number.parseFloat(baseAdditionalHourRate)
      } else {
        // Convert to days if 24+ hours
        const days = Math.ceil(amount / 24)
        return calculateBasePrice("days", days)
      }
    } else if (type === "days") {
      if (amount === 1) {
        return Number.parseFloat(baseDayRate)
      } else {
        return Number.parseFloat(baseDayRate) + (amount - 1) * Number.parseFloat(baseAdditionalDayRate)
      }
    } else if (type === "weeks") {
      if (amount === 4) {
        return Number.parseFloat(baseFourWeekRate)
      } else if (amount === 1) {
        return Number.parseFloat(baseWeekRate)
      } else {
        return Number.parseFloat(baseWeekRate) + (amount - 1) * Number.parseFloat(baseAdditionalWeekRate)
      }
    }
    return 0
  }

  const calculateAgeDiscount = (age: number): number => {
    for (const range of ageDiscountRanges) {
      const minAge = Number.parseFloat(range.minAge)
      const maxAge = Number.parseFloat(range.maxAge)
      const multiplier = Number.parseFloat(range.multiplier)

      if (age >= minAge && age <= maxAge) {
        return (age - 17) * multiplier
      }
    }
    // Cap at age 80 for ages above 80
    if (age > 80) {
      const lastRange = ageDiscountRanges[ageDiscountRanges.length - 1]
      return (80 - 17) * Number.parseFloat(lastRange.multiplier)
    }
    return 0
  }

  const calculateDiscount = (basePrice: number, age: number, licenseRange: string): number => {
    // Calculate age-based discount in absolute value
    const ageDiscountAmount = calculateAgeDiscount(age)
    // Calculate license-based discount as percentage
    const licenseDiscount = licenseDiscounts.find((d) => d.range === licenseRange)
    const licenseDiscountPercentage = licenseDiscount ? Number.parseFloat(licenseDiscount.discount) : 0

    // Apply discounts: subtract absolute age discount, then apply percentage license discount
    const priceAfterAgeDiscount = basePrice - ageDiscountAmount
    const finalPrice = priceAfterAgeDiscount * (1 - licenseDiscountPercentage / 100)

    return finalPrice
  }

  const runTest = () => {
    const amount = Number.parseFloat(testCoverAmount)
    const age = Number.parseFloat(testAge)

    if (isNaN(amount) || isNaN(age) || !testLicenseRange) {
      return
    }

    const basePrice = calculateBasePrice(testCoverType, amount)

    const ageDiscountAmount = calculateAgeDiscount(age)
    const licenseDiscount = licenseDiscounts.find((d) => d.range === testLicenseRange)
    const licenseDiscountPercentage = licenseDiscount ? Number.parseFloat(licenseDiscount.discount) : 0

    const priceAfterAgeDiscount = basePrice - ageDiscountAmount
    const licenseDiscountAmount = priceAfterAgeDiscount * (licenseDiscountPercentage / 100)
    const finalPrice = priceAfterAgeDiscount - licenseDiscountAmount

    setTestResult(Number.parseFloat(finalPrice.toFixed(2)))
    setTestBreakdown({
      basePrice: Number.parseFloat(basePrice.toFixed(2)),
      ageDiscount: Number.parseFloat(ageDiscountAmount.toFixed(2)),
      licenseDiscount: Number.parseFloat(licenseDiscountAmount.toFixed(2)),
      finalPrice: Number.parseFloat(finalPrice.toFixed(2)),
    })
  }

  const addAgeDiscountRange = () => {
    setAgeDiscountRanges([...ageDiscountRanges, { minAge: "", maxAge: "", multiplier: "" }])
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-primary px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-lg font-bold tracking-wide text-primary-foreground">TEMPNOW</h1>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-12">
        <div className="mx-auto max-w-4xl space-y-6">
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
                    value={baseHourRate}
                    onChange={(e) => setBaseHourRate(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Additional Hour Rate {"<24hrs"} (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={baseAdditionalHourRate}
                    onChange={(e) => setBaseAdditionalHourRate(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Base Day Rate (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={baseDayRate}
                    onChange={(e) => setBaseDayRate(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Additional Day Rate (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={baseAdditionalDayRate}
                    onChange={(e) => setBaseAdditionalDayRate(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Base Week Rate (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={baseWeekRate}
                    onChange={(e) => setBaseWeekRate(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Additional Week Rate (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={baseAdditionalWeekRate}
                    onChange={(e) => setBaseAdditionalWeekRate(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium text-foreground">Base 4 Week Rate (£)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={baseFourWeekRate}
                    onChange={(e) => setBaseFourWeekRate(e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
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
                  <Button onClick={addAgeDiscountRange} variant="outline" size="sm">
                    Add Range
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Formula: (age - 17) × multiplier = discount amount in £</p>
                {ageDiscountRanges.map((range, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Min Age"
                        value={range.minAge}
                        onChange={(e) => {
                          const updated = [...ageDiscountRanges]
                          updated[index].minAge = e.target.value
                          setAgeDiscountRanges(updated)
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
                          const updated = [...ageDiscountRanges]
                          updated[index].maxAge = e.target.value
                          setAgeDiscountRanges(updated)
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
                          const updated = [...ageDiscountRanges]
                          updated[index].multiplier = e.target.value
                          setAgeDiscountRanges(updated)
                        }}
                        className="h-10"
                      />
                    </div>
                    <Button
                      onClick={() => setAgeDiscountRanges(ageDiscountRanges.filter((_, i) => i !== index))}
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
                          const updated = [...licenseDiscounts]
                          updated[index].discount = e.target.value
                          setLicenseDiscounts(updated)
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
                    <SelectTrigger className="h-10">
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
                    <SelectTrigger className="h-10">
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
                        <span className="text-muted-foreground">License Discount:</span>
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
      </div>
    </div>
  )
}
