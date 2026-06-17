"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RefundEvent {
  id: number
  eventType: string
  firstName: string | null
  lastName: string | null
  email: string | null
  address: string | null
  amount: string | null
  currency: string | null
  updatedAt: string
  blacklistedAt: string | null
}

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-GB")

export function RefundRequestsSection() {
  const [items, setItems] = useState<RefundEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [blacklistingId, setBlacklistingId] = useState<number | null>(null)
  const [isBlacklistDialogOpen, setIsBlacklistDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<RefundEvent | null>(null)
  const [blacklistEmail, setBlacklistEmail] = useState(true)
  const [blacklistAddress, setBlacklistAddress] = useState(false)
  const { toast } = useToast()


  

  const loadEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/refund-events")
      if (!response.ok) {
        throw new Error("Failed to load refund requests")
      }

      const payload = await response.json()
      setItems(payload.data ?? [])
    } catch (error) {
      console.error(error)
      toast({
        title: "Unable to load refund requests",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const openBlacklistDialog = (item: RefundEvent) => {
      setSelectedItem(item)
      setBlacklistEmail(Boolean(item.email))
      setBlacklistAddress(false)
      setIsBlacklistDialogOpen(true)
    }

  const blacklistUser = async () => {
    if (!selectedItem) {
      return
    }
    try {
      setBlacklistingId(selectedItem.id)
      const response = await fetch(`/api/admin/refund-events/${selectedItem.id}/blacklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blacklistEmail,
          blacklistAddress,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to blacklist user")
      }

      toast({
        title: "User blacklisted",
        description: `${selectedItem.email ?? "Customer"} has been added to the blacklist.`,
      })

      setIsBlacklistDialogOpen(false)
      setSelectedItem(null)
      await loadEvents()
    } catch (error: any) {
      toast({
        title: "Blacklist failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setBlacklistingId(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Refund Requests</CardTitle>
          <CardDescription>Refunds and chargebacks received from Paddle webhooks.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={loadEvents} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Blocked via</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  No refund or chargeback records found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const amount = item.amount ? `${item.currency ?? ""} ${item.amount}` : "N/A"
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant={item.eventType === "chargeback" ? "destructive" : "secondary"}>{item.eventType}</Badge>
                    </TableCell>
                    <TableCell>{`${item.firstName || ""} ${item.lastName || ""}`}</TableCell>
                    
                    <TableCell>{item.email || "-"}</TableCell>
                    <TableCell className="max-w-[220px] truncate" title={item.address ?? ""}>{item.address || "-"}</TableCell>
                    <TableCell>{amount}</TableCell>
                    <TableCell>{formatDate(item.updatedAt)}</TableCell>
                    <TableCell>{item.blacklistedTargets || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={blacklistingId === item.id || !!item.blacklistedAt}
                        onClick={() => openBlacklistDialog(item)}
                      >
                        {item.blacklistedAt ? "Blacklisted" : blacklistingId === item.id ? "Blocking..." : "Blacklist"}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isBlacklistDialogOpen} onOpenChange={setIsBlacklistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Blacklist refund request</DialogTitle>
            <DialogDescription>Choose what should be added to blacklist for this request.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="blacklist-email"
                checked={blacklistEmail}
                onCheckedChange={(checked) => setBlacklistEmail(Boolean(checked))}
                disabled={!selectedItem?.email}
              />
              <Label htmlFor="blacklist-email">Block email ({selectedItem?.email ?? "Not available"})</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="blacklist-address"
                checked={blacklistAddress}
                onCheckedChange={(checked) => setBlacklistAddress(Boolean(checked))}
              />
              <Label htmlFor="blacklist-address">Block address from the related quote</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlacklistDialogOpen(false)}>Cancel</Button>
            <Button onClick={blacklistUser} disabled={(!blacklistEmail && !blacklistAddress) || blacklistingId === selectedItem?.id}>
              {blacklistingId === selectedItem?.id ? "Blocking..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}