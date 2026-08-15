"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { getPoliciesByEmail } from "@/lib/data"
import { Skeleton } from "@/components/ui/skeleton"
import {
  UserIcon,
  FileTextIcon,
  X,
  Search,
  Car,
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  Shield,
  Eye,
} from "lucide-react"

const PoliciesSection = () => {
  const [policies, setPolicies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPolicy, setSelectedPolicy] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const demoOrder = {
    id: "demo-001",
    policyNumber: "P-12345",
    registration: "AB12 CDE",
    make: "Volkswagen",
    model: "Golf",
    status: "active",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    price: "£25.00",
    duration: "7 days",
    premium: 25.0,
    createdAt: new Date().toISOString(),
  }

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const userEmail = localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail")

        if (!userEmail) {
          setError("User not authenticated")
          setLoading(false)
          return
        }

        const userPolicies = await getPoliciesByEmail(userEmail)
        setPolicies([demoOrder, ...userPolicies])
        setLoading(false)
      } catch (err) {
        console.error("Error fetching documents:", err)
        setError("Failed to load documents. Please try again later.")
        setPolicies([demoOrder])
        setLoading(false)
      }
    }

    fetchPolicies()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "expired":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "cancelled":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      default:
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return "🟢"
      case "expired":
        return "🔴"
      case "pending":
        return "🟡"
      case "cancelled":
        return "⚫"
      default:
        return "🔵"
    }
  }

  const filteredPolicies = policies.filter(
    (policy) =>
      policy.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.registration.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffInHours = Math.round((end - start) / (1000 * 60 * 60))

    if (diffInHours < 24) {
      return diffInHours === 1 ? "1 hour" : `${diffInHours} hours`
    } else {
      const days = Math.round(diffInHours / 24)
      return days === 1 ? "1 day" : `${days} days`
    }
  }

  const openModal = (policy) => {
    setSelectedPolicy(policy)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedPolicy(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Error Loading Documents</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (policies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center max-w-md px-6">
          {/* Animated gradient background circle */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-full blur-3xl" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-full flex items-center justify-center mx-auto border border-cyan-500/30">
              <Shield className="w-12 h-12 text-cyan-400" />
            </div>
          </div>

          <h3 className="text-2xl font-bold text-white mb-3">No Documents Yet</h3>

          <Link href="/coverise">
            <Button className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold px-8 py-6 text-base shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/40 hover:scale-105">
              <Shield className="w-5 h-5 mr-2" />
              Get Your First Document
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">My Documents</h2>
          <p className="text-gray-400 mt-1">
            {policies.length} {policies.length === 1 ? "document" : "documents"} found
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black/50 border-cyan-500/30 text-white placeholder:text-gray-500 focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Policy Cards */}
      <div className="grid gap-6">
        {filteredPolicies.map((policy) => (
          <Card
            key={policy.id}
            className="bg-gray-900/50 border border-cyan-500/30 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-200 backdrop-blur-sm"
          >
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                    <Car className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Document {policy.policyNumber}</h3>
                    <p className="text-sm text-gray-400">Purchased on {formatDate(policy.createdAt)}</p>
                  </div>
                </div>

                <Badge className={`${getStatusColor(policy.status)} font-medium`}>
                  <span className="mr-1">{getStatusIcon(policy.status)}</span>
                  {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Vehicle Info */}
              <div className="bg-black/30 rounded-lg p-4 mb-4 border border-cyan-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Car className="w-4 h-4 text-cyan-400" />
                  <span className="font-medium text-white">Vehicle Details</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Registration</span>
                    <p className="font-medium text-white">{policy.registration}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Make & Model</span>
                    <p className="font-medium text-white">
                      {policy.make} {policy.model}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Premium</span>
                    <p className="font-medium text-cyan-400">£{policy.premium.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Duration</span>
                    <p className="font-medium text-white">{calculateDuration(policy.startDate, policy.endDate)}</p>
                  </div>
                </div>
              </div>

              {/* Document Period */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-black/30 rounded-lg mb-4 border border-cyan-500/20">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-sm text-gray-400">Valid From</p>
                    <p className="font-medium text-white">{formatDateTime(policy.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-sm text-gray-400">Valid Until</p>
                    <p className="font-medium text-white">{formatDateTime(policy.endDate)}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => openModal(policy)}
                  variant="outline"
                  className="flex-1 bg-gray-800/50 border-cyan-500/50 text-white hover:bg-gray-700 hover:border-cyan-500"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Details
                </Button>
                <Link href={`/coverise/order/view?number=${policy.policyNumber}`} className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg shadow-cyan-500/25">
                    <FileTextIcon className="w-4 h-4 mr-2" />
                    Documents
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Search Results */}
      {filteredPolicies.length === 0 && searchTerm && (
        <div className="text-center py-16">
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full flex items-center justify-center mx-auto border border-gray-700">
              <Search className="w-10 h-10 text-gray-500" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Results Found</h3>
          <p className="text-gray-400 mb-6">
            No documents found matching <span className="text-cyan-400 font-medium">"{searchTerm}"</span>
          </p>
          <Button
            variant="outline"
            onClick={() => setSearchTerm("")}
            className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50"
          >
            Clear Search
          </Button>
        </div>
      )}

      {/* Enhanced Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-cyan-500/30">
          <DialogHeader className="border-b border-cyan-500/20 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                  <Shield className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">
                    Document {selectedPolicy?.policyNumber}
                  </DialogTitle>
                  <p className="text-sm text-gray-400">Complete document information</p>
                </div>
              </div>
              <button onClick={closeModal} className="rounded-lg p-2 hover:bg-cyan-500/10 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </DialogHeader>

          {selectedPolicy && (
            <div className="space-y-6 pt-6">
              {/* Document Status */}
              <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-cyan-500/20">
                <div className="flex items-center gap-3">
                  <Badge className={`${getStatusColor(selectedPolicy.status)} font-medium text-sm`}>
                    <span className="mr-1">{getStatusIcon(selectedPolicy.status)}</span>
                    {selectedPolicy.status.charAt(0).toUpperCase() + selectedPolicy.status.slice(1)}
                  </Badge>
                  <span className="text-sm text-gray-400">Purchased on {formatDate(selectedPolicy.createdAt)}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Premium</p>
                  <p className="text-xl font-bold text-cyan-400">£{selectedPolicy.premium.toFixed(2)}</p>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card className="bg-gray-800/50 border-cyan-500/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-5 h-5 text-cyan-400" />
                      <h3 className="font-semibold text-white">Personal Information</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Full Name</p>
                        <p className="font-medium text-white">John Smith</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Date of Birth</p>
                        <p className="font-medium text-white">15/03/1985</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-cyan-500/10">
                      <Mail className="w-4 h-4 text-cyan-400" />
                      <div>
                        <p className="text-sm text-gray-400">Email Address</p>
                        <p className="font-medium text-white">john.smith@example.com</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-black/30 rounded-lg border border-cyan-500/10">
                      <Phone className="w-4 h-4 text-cyan-400" />
                      <div>
                        <p className="text-sm text-gray-400">Phone Number</p>
                        <p className="font-medium text-white">+44 7123 456789</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-black/30 rounded-lg border border-cyan-500/10">
                      <MapPin className="w-4 h-4 text-cyan-400 mt-1" />
                      <div>
                        <p className="text-sm text-gray-400">Address</p>
                        <p className="font-medium text-white">123 Example Street, London</p>
                        <p className="font-medium text-white">SW1A 1AA</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle Information */}
                <Card className="bg-gray-800/50 border-cyan-500/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Car className="w-5 h-5 text-cyan-400" />
                      <h3 className="font-semibold text-white">Vehicle Information</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Registration</p>
                        <p className="font-medium text-white text-lg">{selectedPolicy.registration}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-black/30 rounded-lg border border-cyan-500/10">
                      <p className="text-sm text-gray-400 mb-1">Make & Model</p>
                      <p className="font-medium text-white text-lg">
                        {selectedPolicy.make} {selectedPolicy.model}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Document Information */}
              <Card className="bg-gray-800/50 border-cyan-500/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-semibold text-white">Document Information</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                        <Calendar className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Period</p>
                        <p className="font-medium text-white">{formatDateTime(selectedPolicy.startDate)}</p>
                        <p className="text-sm text-gray-400">to</p>
                        <p className="font-medium text-white">{formatDateTime(selectedPolicy.endDate)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                        <Clock className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Duration</p>
                        <p className="font-medium text-white">
                          {calculateDuration(selectedPolicy.startDate, selectedPolicy.endDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center border border-cyan-500/30">
                        <CreditCard className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Amount Paid</p>
                        <p className="font-medium text-cyan-400 text-lg">£{selectedPolicy.premium.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-cyan-500/20">
                <Button
                  onClick={closeModal}
                  variant="outline"
                  className="flex-1 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 bg-transparent"
                >
                  Close
                </Button>
                <Link href={`/policy/view?number=${selectedPolicy.policyNumber}`} className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white shadow-lg shadow-cyan-500/25">
                    <FileTextIcon className="w-4 h-4 mr-2" />
                    View Documents
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { PoliciesSection }
export default PoliciesSection
