"use client"



import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { calculateDiscountedTotal } from "@/lib/coupon-utils";
import {
  Car,
  Clock,
  ArrowLeft,
  User,
  MapPin,
  CreditCard,
  Search,
  CheckCircle,
  Calculator,
  Download,
  Shield,
  Tag,
  FileText,
} from "lucide-react"
import { useAuth } from "@/context/auth"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { useToast } from "@/hooks/use-toast"
import { useQuoteExpiration } from "@/hooks/use-quote-expiration.tsx";
import { calculateQuote as calculateQuoteCommon } from "@/lib/quote";


import { occupation_list } from "@/lib/occupation";

// Add a new function to calculate the next 5-minute increment time
const getNext5MinuteTime = () => {
  const now = new Date()
  const minutes = now.getMinutes()
  const remainder = minutes % 5

  // Add minutes to round up to the next 5-minute increment
  now.setMinutes(minutes + (remainder === 0 ? 0 : 5 - remainder))
  now.setSeconds(0)
  now.setMilliseconds(0)

  return now
}

// Format date as dd/mm/yy hh:mm
const formatDateTime = (date: Date) => {
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear().toString().slice(-2)
  const hours = date.getHours().toString().padStart(2, "0")
  const mins = date.getMinutes().toString().padStart(2, "0")

  return `${day}/${month}/${year} ${hours}:${mins}`
}

export default function GetQuotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registrationFromHome = searchParams.get("reg")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Redirect to home if accessed directly without registration parameter
  useEffect(() => {
    if (isClient && !registrationFromHome) {
      router.push("/")
    }
  }, [isClient, registrationFromHome, router])

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // 1. Replace the existing formData state initialization to include separate hour and minute fields:
  const [formData, setFormData] = useState({
    title: "", // Added title field for driver's title (Mr, Mrs, Miss, Ms)
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirthDay: "",
    dateOfBirthMonth: "",
    dateOfBirthYear: "",
    phoneNumber: "",
    occupation: "",
    postcode: "",
    address: "",
    licenseType: "",
    licenseHeld: "",
    vehicleValue: "",
    reason: "",
    durationType: "Hours",
    duration: "1 hour",
    showDurationDropdown: false,
    startDate: "Immediate Start",
    startTime: "",
    startHour: "",
    startMinute: "",
    modifications: [] as string[],
  })

  const [vehicle, setVehicle] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [showAddresses, setShowAddresses] = useState(false)
  const [showQuote, setShowQuote] = useState(false)
  const [quote, setQuote] = useState(null)
  const { ExpirationDialog } = useQuoteExpiration(quote);
  const [isCalculating, setIsCalculating] = useState(false)
  const [isPostcodeLoading, setIsPostcodeLoading] = useState(false)
  const [postcodeError, setPostcodeError] = useState("")
  const [showReview, setShowReview] = useState(false)
  const [ageError, setAgeError] = useState("")
  const { isAuthenticated, user } = useAuth()
  const { toast } = useToast()
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
  const [isLoginCompleted, setIsLoginCompleted] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [accuracyConfirmed, setAccuracyConfirmed] = useState(false)
  const [email, setEmail] = useState("")
  const [showSummary, setShowSummary] = useState(false)
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
  })
  const [billingDetails, setBillingDetails] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    country: "United Kingdom",
  })
  const [sameBillingAddress, setSameBillingAddress] = useState(true)
  const [reviewStartTime, setReviewStartTime] = useState(null);
  const [reviewExpiryTime, setReviewExpiryTime] = useState(null);
  const [quoteSettings, setQuoteSettings] = useState(null);
  // 1. Add a new state for showing time selection:
  const [showTimeSelection, setShowTimeSelection] = useState(false)
  const [filteredOccupations, setFilteredOccupations] = useState(occupation_list.map(o => o.desc))
  const [showOccupationDropdown, setShowOccupationDropdown] = useState(false)
  const [occupationSearch, setOccupationSearch] = useState("")
  const occupationInputRef = useRef<HTMLInputElement>(null)
  const [customModifications, setCustomModifications] = useState<Record<string, string>>({})
  const [showOtherInput, setShowOtherInput] = useState<Record<string, boolean>>({})


  useEffect(() => {
    const fetchQuoteSettings = async () => {
      try {
        const response = await fetch('/api/quote-settings');
        const data = await response.json();
        if (data.success) {
          setQuoteSettings(data.quoteFormula);
        }
      } catch (error) {
        console.error("Failed to fetch quote settings:", error);
      }
    };

    fetchQuoteSettings();
  }, []);

  useEffect(() => {
    if (isAuthenticated && isLoginCompleted) {
      if (sessionStorage.getItem("pendingPayment") === "true") {
        sessionStorage.removeItem("pendingPayment")
        proceedToPaymentLogic()
      }
      setIsLoginCompleted(false)
    }
  }, [isAuthenticated, isLoginCompleted, quote])

  useEffect(() => {
    if (registrationFromHome) {
      const fetchVehicleData = async () => {
        try {
          const response = await fetch('/api/check-vehicle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registration: registrationFromHome }),
          });
          if (response.ok) {
            const data = await response.json();
            setVehicle(data);
          } else {
            console.error("Failed to fetch vehicle data on get-quote page, redirecting to home.");
            router.push("/");
          }
        } catch (error) {
          console.error("Error fetching vehicle data on get-quote page:", error);
          router.push("/");
        }
      };
      fetchVehicleData();
    }
  }, [registrationFromHome, router]);

  useEffect(() => {
    const view = searchParams.get('view');
    if (view === 'review') {
      const storedData = localStorage.getItem("quoteRestorationData");
      if (storedData) {
        try {
          const { formData, quote, appliedPromo, discountAmount, reviewStartTime, reviewExpiryTime } = JSON.parse(storedData);
          
          setFormData(formData);
          setQuote(quote);
          setAppliedPromo(appliedPromo);
          setDiscountAmount(discountAmount);
          if (appliedPromo) {
            setPromoCode(appliedPromo.promoCode);
          }
          setReviewStartTime(reviewStartTime);
          setReviewExpiryTime(reviewExpiryTime);
          
          // Repopulate custom modifications from the restored modifications list
          const restoredCustomMods: Record<string, string> = {};
          const restoredShowOther: Record<string, boolean> = {};
          formData.modifications.forEach((mod: string) => {
            if (mod.includes(" - Other: ")) {
              const parts = mod.split(" - Other: ");
              const category = parts[0];
              const value = parts[1];
              if (category && value) {
                restoredCustomMods[category] = value;
                restoredShowOther[category] = true;
              }
            }
          });
          setCustomModifications(restoredCustomMods);
          setShowOtherInput(restoredShowOther);

          setShowReview(true);

          const reg = searchParams.get('reg');
          router.replace(`/get-quote?reg=${reg}`, undefined, { shallow: true });
          localStorage.removeItem("quoteRestorationData");
        } catch (e) {
          console.error("Failed to restore quote state from localStorage", e);
          router.push('/');
        }
      }
    }
  }, [searchParams, router]);

  const handleInputChange = (field: string, value: string | boolean) => {
    // Special handling for phone number field
    if (field === "phoneNumber" && typeof value === "string") {
      // Only allow digits
      const digitsOnly = value.replace(/\D/g, "")

      // If empty, allow it
      if (digitsOnly === "") {
        setFormData((prev) => ({
          ...prev,
          [field]: "",
        }))
        return
      }

      // Check if it starts with valid UK prefix (07 or 447)
      const isValidStart = digitsOnly.startsWith("07") || digitsOnly.startsWith("447")

      // Limit to 11 digits for UK numbers (e.g., 07123456789)
      const limitedValue = digitsOnly.slice(0, 11)

      // Only update if valid start or if user is still typing the prefix
      if (isValidStart || (digitsOnly.length <= 3 && ("07".startsWith(digitsOnly) || "447".startsWith(digitsOnly)))) {
        setFormData((prev) => ({
          ...prev,
          [field]: limitedValue,
        }))
      }
      return
    }

    let processedValue = value

    if (field === "firstName" || field === "lastName") {
      const lettersOnly = value.replace(/[^A-Za-z]/g, "")
      processedValue = lettersOnly
    }

    if (field === "occupation") {
      const lettersAndSpacesOnly = value.replace(/[^A-Za-z\s]/g, "")
      processedValue = lettersAndSpacesOnly
    }

    if (field === "occupation") {
      setOccupationSearch(value as string);
    }

    // 3. Update the handleInputChange function to handle startDate changes:
    // 3. Update the handleInputChange function to handle hour and minute changes:
    if (field === "startHour") {
      setFormData((prev) => ({
        ...prev,
        startHour: value as string,
        startMinute: "", // Reset minute when hour changes
        startTime: "", // Reset combined time
      }))
      return
    }

    if (field === "startMinute") {
      const combinedTime = `${formData.startHour}:${value as string}`
      setFormData((prev) => ({
        ...prev,
        startMinute: value as string,
        startTime: combinedTime,
      }))
      return
    }

    if (field === "startDate") {
      setShowTimeSelection(value !== "Immediate Start")
      if (value === "Immediate Start") {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
          startTime: "",
          startHour: "",
          startMinute: "",
        }))
      } else {
        setFormData((prev) => ({
          ...prev,
          [field]: value,
        }))
      }
      return
    }

    setFormData((prev) => ({
      ...prev,
      [field]: processedValue,
    }))

    // Filter occupations when typing in occupation field
    if (field === "occupation") {
      const filtered = occupation_list.filter((job) => job.desc.toLowerCase().includes(value.toString().toLowerCase())).map(o => o.desc);
      setFilteredOccupations(filtered)
      setShowOccupationDropdown(true)
    }
  }

  const handleModificationToggle = (modification: string) => {
    setFormData((prev) => {
      const isSelected = prev.modifications.includes(modification)
      if (isSelected) {
        return {
          ...prev,
          modifications: prev.modifications.filter((m) => m !== modification),
        }
      } else {
        return {
          ...prev,
          modifications: [...prev.modifications, modification],
        }
      }
    })
  }

  const handleOtherToggle = (category: string) => {
    setShowOtherInput((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))

    // If unchecking, remove the custom modification
    if (showOtherInput[category]) {
      const customModKey = `${category} - Other: ${customModifications[category]}`
      setFormData((prev) => ({
        ...prev,
        modifications: prev.modifications.filter((m) => m !== customModKey),
      }))
      setCustomModifications((prev) => ({
        ...prev,
        [category]: "",
      }))
    }
  }

  const handleCardDetailsChange = (field: string, value: string) => {
    let processedValue = value

    if (field === "cardNumber") {
      // Only allow digits and format with spaces
      const digitsOnly = value.replace(/\D/g, "")
      // Format with spaces every 4 digits
      processedValue = digitsOnly
        .replace(/(\d{4})/g, "$1 ")
        .trim()
        .slice(0, 19) // Limit to 16 digits + 3 spaces
    }

    if (field === "cardName") {
      // Only allow letters and spaces
      processedValue = value.replace(/[^A-Za-z\s]/g, "")
    }

    if (field === "expiryMonth" || field === "expiryYear" || field === "cvv") {
      // Only allow digits
      processedValue = value.replace(/\D/g, "")

      // Limit CVV to 3 or 4 digits
      if (field === "cvv") {
        processedValue = processedValue.slice(0, 4)
      }
    }

    setCardDetails((prev) => ({
      ...prev,
      [field]: processedValue,
    }))
  }

  const handleBillingDetailsChange = (field: string, value: string) => {
    setBillingDetails((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handlePostcodeLookup = async () => {
    // Reset any previous errors
    setPostcodeError("")

    // Check if postcode is empty
    if (!formData.postcode.trim()) {
      setPostcodeError("Please enter a postcode before searching")
      return
    }

    setIsPostcodeLoading(true)

    try {
      const response = await fetch(`/api/postcode-lookup?postcode=${encodeURIComponent(formData.postcode)}`);

      if (response.ok) {
        const data = await response.json();

        if (data.addresses && data.addresses.length > 0) {
          setAddresses(data.addresses);
          setShowAddresses(true);
        } else {
          setPostcodeError("Address not found. Please enter your address manually below.");
          setAddresses([]);
          setShowAddresses(false);
        }
      } else {
        setPostcodeError("Address not found. Please enter your address manually below.");
        setShowAddresses(false);
      }
    } catch (error) {
      console.error("An error occurred during postcode lookup", error);
      setPostcodeError("Address not found. Please enter your address manually below.");
      setShowAddresses(false);
    } finally {
      setIsPostcodeLoading(false)
      setFormData(prev => ({
        ...prev,
        address: ""
      }));
    }
  }

  const handleCustomModificationChange = (category: string, value: string) => {
    const oldCustomValue = customModifications[category] || "";
    
    setCustomModifications((prev) => ({
      ...prev,
      [category]: value,
    }));

    setFormData((prev) => {
      // Remove the old custom modification string if it exists
      const oldCustomModKey = `${category} - Other: ${oldCustomValue}`;
      const filteredMods = prev.modifications.filter((m) => m !== oldCustomModKey);

      // Add the new custom modification string if the value is not empty
      const newCustomModKey = `${category} - Other: ${value}`;
      const newMods = value.trim() ? [...filteredMods, newCustomModKey] : filteredMods;
      
      return { ...prev, modifications: newMods };
    });
  };
// ...

  const calculateQuote = () => {
    if (!quoteSettings) return null;

    const calculatedQuote = calculateQuoteCommon(quoteSettings, formData);

    let startTime: Date;
    if (formData.startDate === "Immediate Start") {
      startTime = getNext5MinuteTime();
    } else {
      // Parse the selected date from formData.startDate
      const dateParts = formData.startDate.split(', ')[1].split(' ');
      const day = parseInt(dateParts[0]);
      const monthName = dateParts[1];
      const year = new Date().getFullYear(); // Assuming current year for simplicity, adjust if year selection is added

      const monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];
      const month = monthNames.indexOf(monthName);

      startTime = new Date(year, month, day);
      startTime.setHours(parseInt(formData.startHour));
      startTime.setMinutes(parseInt(formData.startMinute));
      startTime.setSeconds(0);
      startTime.setMilliseconds(0);
    }
    
    const expiryTime = new Date(startTime);

    // Add duration
    const durationVal = Number.parseInt(formData.duration.split(" ")[0])
    if (formData.durationType === "Hours") {
      expiryTime.setHours(expiryTime.getHours() + durationVal)
    } else if (formData.durationType === "Days") {
      expiryTime.setDate(expiryTime.getDate() + durationVal)
    } else {
      // Weeks
      expiryTime.setDate(expiryTime.getDate() + durationVal * 7)
    }

    return {
        ...calculatedQuote,
        startTime: formatDateTime(startTime),
        expiryTime: formatDateTime(expiryTime),
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.occupation) {
      toast({
        variant: "destructive",
        title: "Occupation is required",
        description: "Please select your occupation.",
      });
      return;
    }

    const calculatedQuote = calculateQuote();
    setQuote(calculatedQuote);
    localStorage.setItem('quoteCreationTimestamp', Date.now().toString());

    setReviewStartTime(calculatedQuote.startTime);
    setReviewExpiryTime(calculatedQuote.expiryTime);

    setShowReview(true)
    // Scroll to top on mobile
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleNewQuote = () => {
    setShowQuote(false)
    setQuote(null)
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const selectOccupation = (occupation: string) => {
    handleInputChange("occupation", occupation)
    setShowOccupationDropdown(false)
    setOccupationSearch(occupation) // Update search term as well
  }

  const handleDurationTypeChange = (type: string) => {
    setFormData((prev) => {
      // Reset duration based on type
      let newDuration = ""
      let showDropdown = prev.showDurationDropdown

      if (type === "Hours") {
        newDuration = "1 hour"
        showDropdown = false
      } else if (type === "Days") {
        newDuration = "1 day"
        showDropdown = false
      } else if (type === "Weeks") {
        newDuration = "1 week"
        showDropdown = false
      }

      return {
        ...prev,
        durationType: type,
        duration: newDuration,
        showDurationDropdown: showDropdown,
      }
    })
  }

  const handleDurationChange = (duration: string) => {
    setFormData((prev) => ({
      ...prev,
      duration: duration,
    }))
  }

  const handleOtherDurationClick = () => {
    setFormData((prev) => ({
      ...prev,
      showDurationDropdown: true,
    }))
  }

  const generateDateOptions = () => {
    const options = ["Immediate Start"]
    const today = new Date()

    for (let i = 0; i < 28; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)

      let dayName = ""
      if (i === 0) dayName = "Today"
      else if (i === 1) dayName = "Tomorrow"
      else dayName = date.toLocaleDateString("en-GB", { weekday: "long" })

      const dateStr = date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
      })

      options.push(`${dayName}, ${dateStr}`)
    }

    return options
  }

  // Generate hour options for dropdown (1-23 hours)
  const hourOptions = Array.from({ length: 23 }, (_, i) => `${i + 1} ${i === 0 ? "hour" : "hours"}`)

  // Generate day options for dropdown (1-28 days)
  const dayOptions = Array.from({ length: 28 }, (_, i) => `${i + 1} ${i === 0 ? "day" : "days"}`)

  // Generate week options for dropdown (1-4 weeks)
  const weekOptions = Array.from({ length: 4 }, (_, i) => `${i + 1} ${i === 0 ? "week" : "weeks"}`)

  // Get the appropriate options based on duration type
  const getDurationOptions = () => {
    if (formData.durationType === "Hours") {
      return hourOptions
    } else if (formData.durationType === "Days") {
      return dayOptions
    } else {
      return weekOptions
    }
  }

  // 2. Add a function to generate time options in 5-minute increments:
  const generateTimeOptions = () => {
    const options = []
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        // Skip past times for today
        if (
          formData.startDate.includes("Today") &&
          (hour < currentHour || (hour === currentHour && minute <= currentMinute))
        ) {
          continue
        }

        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        options.push(timeString)
      }
    }

    return options
  }

  // 2. Add a function to generate available minutes based on selected hour:
  const generateMinuteOptions = (selectedHour: string) => {
    const options = []
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const hourNum = Number.parseInt(selectedHour)

    for (let minute = 0; minute < 60; minute += 5) {
      // Skip past minutes for today if it's the current hour
      if (formData.startDate.includes("Today") && hourNum === currentHour && minute <= currentMinute) {
        continue
      }

      const minuteString = minute.toString().padStart(2, "0")
      options.push(minuteString)
    }

    return options
  }

  // In the generateHourOptions function, update it to return just the hour numbers without ":00":
  const generateHourOptions = () => {
    const options = []
    const now = new Date()
    const currentHour = now.getHours()

    for (let hour = 0; hour < 24; hour++) {
      // Skip past hours for today
      if (formData.startDate.includes("Today") && hour < currentHour) {
        continue
      }

      const hourString = hour.toString().padStart(2, "0")
      options.push(hourString)
    }

    return options
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest(".occupation-dropdown-container")) {
        setShowOccupationDropdown(false)
      }
    }

    if (showOccupationDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showOccupationDropdown])
  const hasActivePromo = Boolean(appliedPromo)
  const finalQuoteTotal = quote ? Math.max(0, quote.total - (hasActivePromo ? discountAmount : 0)) : 0

  const handleChangeDetails = () => {
    setShowReview(false)
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const proceedToPaymentLogic = async () => {
    setIsCalculating(true)

    const calculatedQuote = calculateQuote()
    const finalTotal = calculatedQuote.total - discountAmount

    // Gather data for blacklist check
    const cleanReg = registrationFromHome?.replace(/\s+/g, "").toUpperCase();
    const dob = `${formData.dateOfBirthDay}/${formData.dateOfBirthMonth}/${formData.dateOfBirthYear}`;

    try {
      // Get client IP for blacklist check
      const ipResponse = await fetch("/api/get-client-ip")
      const { ip } = await ipResponse.json()

      // Perform comprehensive blacklist check
      const blacklistCheckResponse = await fetch('/api/blacklist-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regNumber: cleanReg,
          ipAddress: ip,
          postcode: formData.postcode,
          address: formData.address,
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: dob,
          email: user?.email, // Include email if user is logged in
        }),
      });
      const blacklistResult = await blacklistCheckResponse.json();

      if (blacklistResult.isBlacklisted) {
        toast({ variant: "destructive", title: "Access Restricted", description: blacklistResult.reason || "Your access has been restricted. Please contact support for assistance." });
        setIsCalculating(false);
        return;
      }
    } catch (error) {
      console.error("Failed to perform blacklist check:", error);
      toast({ variant: "destructive", title: "Service Unavailable", description: "Could not perform blacklist check at this time. Please try again later." });
      setIsCalculating(false);
      return;
    }

    const quoteDataForCheckout = {
      userId: user.id,
      total: finalTotal,
      originalTotal: calculatedQuote.total,
      cpw: calculatedQuote.total.toFixed(2),
      update_price: finalTotal.toFixed(2),
      discountAmount: discountAmount,
      promoCode: appliedPromo ? appliedPromo.promoCode : undefined,
      startTime: calculatedQuote.startTime,
      expiryTime: calculatedQuote.expiryTime,
      vehicleModifications: formData.modifications,
      nameTitle: formData.title,
      
      breakdown: {
        duration: calculatedQuote.breakdown.duration,
        reason: formData.reason,
      },
      customerData: {
        firstName: formData.firstName,
        middleName: formData.middleName,
        title: formData.title,
        lastName: formData.lastName,
        dateOfBirth: `${formData.dateOfBirthDay}/${formData.dateOfBirthMonth}/${formData.dateOfBirthYear}`,
        phoneNumber: formData.phoneNumber,
        occupation: formData.occupation,
        address: formData.address,
        licenseType: formData.licenseType,
        licenseHeld: formData.licenseHeld,
        vehicleValue: formData.vehicleValue,
        reason: formData.reason,
        duration: formData.duration,
                  registration: registrationFromHome || "",
                  post_code: formData.postcode,
                  vehicle: {
                    make: vehicle?.make || "",
                    model: vehicle?.model || "",
                    year: vehicle?.year && vehicle.year !== "Unknown" ? vehicle.year : "",
                    engineCC: "1400", // You can add this to vehicle data if needed
                  },      },
    }

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quoteData: quoteDataForCheckout }),
      })

      if (!response.ok) {
        throw new Error("Failed to create quote")
      }

      const newQuote = await response.json()

      // Manually inject the correct total into the object before storing.
      const parsedQuoteData = JSON.parse(newQuote.quoteData);
      parsedQuoteData.total = finalTotal;
      if (appliedPromo) {
        parsedQuoteData.promoCode = appliedPromo.promoCode;
        parsedQuoteData.discountAmount = discountAmount;
        parsedQuoteData.originalTotal = calculatedQuote.total;
      }
      newQuote.quoteData = JSON.stringify(parsedQuoteData);

      // Save data for restoration if user navigates back
      const restorationData = {
        formData,
        quote,
        appliedPromo,
        discountAmount,
        reviewStartTime,
        reviewExpiryTime,
      };
      localStorage.setItem("quoteRestorationData", JSON.stringify(restorationData));

      // Save quote data to localStorage
      localStorage.setItem("quoteData", JSON.stringify(newQuote))

      // Redirect to checkout page
      router.push("/quote-checkout")
    } catch (error) {
      console.error("Error proceeding to payment:", error)
      toast({ variant: "destructive", title: "Error", description: "Could not proceed to payment. Please try again." })
    } finally {
      setIsCalculating(false)
    }
  }

  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      sessionStorage.setItem("pendingPayment", "true")
      setIsAuthDialogOpen(true)
      return
    }
    await proceedToPaymentLogic()
  }



  const handleApplyPromo = async () => {
    const enteredCode = promoCode.trim()
    if (!enteredCode || !quote) return
    setIsApplyingPromo(true)
    toast({ title: "Processing", description: "Checking promo code..." })
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoCode: enteredCode,
          total: quote.total,
          context: {
            lastName: formData.lastName,
            dateOfBirth: `${formData.dateOfBirthYear}-${formData.dateOfBirthMonth.padStart(2, "0")}-${formData.dateOfBirthDay.padStart(2, "0")}`,
            registration: registrationFromHome,
          },
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to validate promo code")

      const coupon = data
      if (typeof coupon.discount === "string") {
        coupon.discount = JSON.parse(coupon.discount)
      }

      const discount = calculateDiscountedTotal(quote.total, coupon)
      setDiscountAmount(discount)
      setAppliedPromo(coupon)

      toast({ title: "Promo Code Applied", description: `Successfully applied promo code ${data.promoCode}` })
    } catch (error: any) {
      setAppliedPromo(null)
      setDiscountAmount(0)
      toast({ variant: "destructive", title: "Invalid Code", description: error.message || "The promo code is invalid or expired" })
    } finally {
      setIsApplyingPromo(false)
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setDiscountAmount(0)
    setPromoCode("")
    toast({ title: "Promo Removed", description: "You can try another code." })
  }

  const handleTogglePassword = () => {
    setShowPassword(!showPassword)
  }

  const handlePurchase = () => {
    if (!termsAccepted || !accuracyConfirmed) {
      alert("Please accept the terms and confirm the accuracy of your information.")
      return
    }

    // Validate card details
    if (
      !cardDetails.cardNumber ||
      !cardDetails.cardName ||
      !cardDetails.expiryMonth ||
      !cardDetails.expiryYear ||
      !cardDetails.cvv
    ) {
      alert("Please fill in all card details.")
      return
    }

    // Validate billing details if not using same address
    if (!sameBillingAddress) {
      if (!billingDetails.addressLine1 || !billingDetails.city || !billingDetails.postcode) {
        alert("Please fill in all required billing details.")
        return
      }
    }

    alert("Purchase successful! Your covernote will be emailed to you shortly.")
  }

  const toggleSummary = () => {
    setShowSummary(!showSummary)
  }

  // Function to validate age
  const validateAge = (day: string, month: string, year: string) => {
    if (day && month && year) {
      const birthDate = new Date(`${year}-${month}-${day}`)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      if (age < 17) {
        setAgeError("You must be at least 17 years old to get a quote.")
      } else {
        setAgeError("")
      }
    }
  }

  const monthInputRef = useRef<HTMLInputElement>(null);
  const yearInputRef = useRef<HTMLInputElement>(null);

  // If redirecting, show loading state
  if (!isClient || !registrationFromHome) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to home page...</p>
        </div>
      </div>
    )
  }

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex flex-col">
      <ExpirationDialog />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-teal-200 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-gray-200 rounded-full blur-3xl opacity-25"></div>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, gray 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        ></div>
      </div>

      <Header mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          {!showReview && (
            <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-3xl p-8 sm:p-10 shadow-2xl mb-8 relative overflow-hidden">
              {/* Decorative background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 20px 20px, white 2px, transparent 0)`,
                    backgroundSize: "40px 40px",
                  }}
                ></div>
              </div>

              {/* Decorative blur orbs */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-400/30 rounded-full blur-2xl"></div>

              <div className="relative z-10 flex items-center space-x-6">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-xl border-2 border-white/30 hover:scale-105 transition-transform duration-300">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-5xl font-bold text-white mb-2">Get Your Quote</h1>
                  <p className="text-teal-50 text-base sm:text-lg">Complete the form to get your instant price</p>
                </div>
              </div>
            </div>
          )}



          {!showReview && vehicle && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl mb-6 sm:mb-8 border-2 border-gray-100 hover:border-teal-200 transition-all duration-300 hover:shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-200">
                    <Car className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Vehicle Details</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Vehicle information</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-teal-50 px-4 py-2 rounded-full border border-teal-200">
                  <CheckCircle className="w-5 h-5 text-teal-600" />
                  <span className="text-sm font-semibold text-teal-700">Verified</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                <div className="relative">
                  <div className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Registration</div>
                  <div className="absolute inset-0 bg-gray-300/20 blur-xl rounded-full"></div>
                  <div className="relative bg-gradient-to-b from-yellow-300 to-yellow-400 rounded-md px-4 py-3 border-2 border-black inline-block shadow-md hover:shadow-lg transition-shadow">
                    <div className="font-bold text-black text-xl tracking-widest">{registrationFromHome}</div>
                  </div>
                </div>
                <div className="relative">
                  <div className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Make</div>
                  <div className="absolute inset-0 bg-gray-300/20 blur-2xl rounded-full"></div>
                  <div className="relative text-xl font-bold text-gray-900 uppercase">{vehicle.make}</div>
                </div>
                <div className="relative">
                  <div className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wide">Model</div>
                  <div className="absolute inset-0 bg-gray-300/20 blur-2xl rounded-full"></div>
                  <div className="relative text-xl font-bold text-gray-900 uppercase">{vehicle.model}</div>
                </div>
              </div>
            </div>
          )}

          {/* Quote Display */}
          {showQuote && quote && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-gray-100 hover:border-teal-200 transition-colors mb-6 sm:mb-8">
              <div className="text-center mb-6 sm:mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Your Quote is Ready!</h2>
                <p className="text-lg text-gray-600">Here's your personalized covernote quote</p>
              </div>

              {/* Quote Summary */}
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 mb-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-center space-y-2">
                  {hasActivePromo ? (
                    <div className="flex flex-col items-center space-y-2 text-white">
                      <div className="text-sm uppercase tracking-[0.2em] text-white/80">Promo Applied</div>
                      <div className="flex items-end justify-center gap-3">
                        <span className="text-3xl font-semibold text-white/70 line-through">
                          £{quote.total.toFixed(2)}
                        </span>
                        <span className="text-5xl sm:text-6xl font-bold text-white">
                          £{finalQuoteTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-emerald-100 font-semibold">
                        You save £{discountAmount.toFixed(2)} with {appliedPromo?.promoCode}
                      </div>
                    </div>
                  ) : (
                    <div className="text-5xl sm:text-6xl font-bold text-white">£{quote.total.toFixed(2)}</div>
                  )}
                  <div className="text-lg text-teal-100">Total Premium</div>
                  <div className="text-sm text-white/80 mt-1">
                    For {quote.breakdown.duration} • {vehicle?.make} {vehicle?.model}
                  </div>
                </div>
              </div>

              {/* Quote Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Car className="w-5 h-5 text-teal-600" />
                    </div>
                    <span>Coverage Details</span>
                  </h3>
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm sm:text-base border-b border-gray-100 pb-2">
                        <span className="text-gray-600 font-medium">Vehicle:</span>
                        <span className="font-semibold text-right text-gray-900">
                          {vehicle?.year} {vehicle?.make} {vehicle?.model}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base border-b border-gray-100 pb-2">
                        <span className="text-gray-600 font-medium">Registration:</span>
                        <span className="font-semibold text-gray-900">{registrationFromHome}</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base border-b border-gray-100 pb-2">
                        <span className="text-gray-600 font-medium">Duration:</span>
                        <span className="font-semibold text-gray-900">{quote.breakdown.duration}</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base border-b border-gray-100 pb-2">
                        <span className="text-gray-600 font-medium">Start Date:</span>
                        <span className="font-semibold text-right text-gray-900">{formData.startDate}</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base border-b border-gray-100 pb-2">
                        <span className="text-gray-600 font-medium">Reason:</span>
                        <span className="font-semibold text-right text-gray-900">{quote.breakdown.reason}</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-gray-600 font-medium">Vehicle Value:</span>
                        <span className="font-semibold text-right text-gray-900">{formData.vehicleValue}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <span>Price Breakdown</span>
                  </h3>
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm sm:text-base border-b border-gray-100 pb-2">
                        <span className="text-gray-600 font-medium">Base Premium:</span>
                        <span className="font-semibold text-gray-900">£{quote.basePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base border-b border-gray-100 pb-2">
                        <span className="text-gray-600 font-medium">Duration Factor:</span>
                        <span className="font-semibold text-gray-900">×{quote.durationMultiplier.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm sm:text-base border-b border-gray-100 pb-2">
                        <span className="text-gray-600 font-medium">Risk Factors:</span>
                        <span className="font-semibold text-gray-900">Applied</span>
                      </div>
                      {hasActivePromo && (
                        <div className="flex justify-between text-sm sm:text-base border-b border-gray-100 pb-2 text-emerald-600">
                          <span className="font-semibold">Promo Savings ({appliedPromo?.promoCode}):</span>
                          <span className="font-bold">-£{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-300 pt-3 font-bold text-base sm:text-lg text-gray-900">
                        <div className="flex justify-between">
                          <span>{hasActivePromo ? "Total After Discount:" : "Total:"}</span>
                          <span className="text-teal-600">
                            £{(hasActivePromo ? finalQuoteTotal : quote.total).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* What's Included */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 sm:p-8 mb-8 shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-teal-600" />
                  </div>
                  <span>What's Included</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    "Third Party Liability Cover",
                    "Instant Digital Certificate",
                    "24/7 Claims Support",
                    "DVLA Compliant",
                  ].map((item) => (
                    <div key={item} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-base text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/quote-checkout" className="flex-1">
                  <Button className="w-full bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2">
                    <Download className="w-5 h-5" />
                    <span>
                      Buy Now - £{(hasActivePromo ? finalQuoteTotal : quote.total).toFixed(2)}
                    </span>
                  </Button>
                </Link>
                <Button
                  onClick={handleNewQuote}
                  variant="outline"
                  className="flex-1 py-4 text-lg font-semibold border-2 border-gray-300 hover:border-teal-500 hover:bg-teal-50 transition-all bg-transparent"
                >
                  Get New Quote
                </Button>
              </div>
            </div>
          )}

          {/* Review Page */}
          {showReview && !showQuote && (
            <div>
              <button
                onClick={handleChangeDetails}
                className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Quote
              </button>

              <div className="bg-white rounded-lg p-6 sm:p-8 shadow-sm border border-gray-200">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Review Your Details</h1>
                  <p className="text-gray-600">Please review your information before proceeding</p>
                </div>

                <div className="space-y-6">
                  {/* Customer Details */}
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-teal-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Customer Details</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Full Name:</span>
                        <span className="font-semibold text-gray-900">
                          {formData.title} {formData.firstName} {formData.middleName} {formData.lastName}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Date of Birth:</span>
                        <span className="font-semibold text-gray-900">
                          {formData.dateOfBirthDay}/{formData.dateOfBirthMonth}/{formData.dateOfBirthYear}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Address:</span>
                        <span className="font-semibold text-gray-900 text-right max-w-[60%]">{formData.address}</span>
                      </div>
                       <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-semibold text-gray-900">{formData.phoneNumber}</span>
                      </div>
                      <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                        <span className="text-gray-600">License Type:</span>
                        <span className="font-semibold text-gray-900">{formData.licenseType}</span>
                      </div>
                       <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                        <span className="text-gray-600">License Held:</span>
                        <span className="font-semibold text-right text-gray-900">{formData.licenseHeld}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Occupation:</span>
                        <span className="font-semibold text-gray-900">{formData.occupation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Details */}
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Car className="w-5 h-5 text-teal-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Vehicle Details</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Registration Number:</span>
                        <span className="font-semibold text-gray-900">{registrationFromHome}</span>
                      </div>
                      <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Make & Model:</span>
                        <span className="font-semibold text-gray-900">
                          {vehicle?.make} {vehicle?.model}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm items-start">
                        <span className="text-gray-600">Modifications:</span>
                        <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                          {formData.modifications.length > 0 ? (
                            formData.modifications.map((mod: any, index: any) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200"
                              >
                                {mod}
                              </span>
                            ))
                          ) : (
                            <span className="font-semibold text-gray-900">None</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document Details */}
                  <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-teal-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Document Details</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-semibold text-gray-900">{formData.duration}</span>
                      </div>
                      <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Reason:</span>
                        <span className="font-semibold text-gray-900">{formData.reason}</span>
                      </div>
                      <div className="flex justify-between text-sm border-b border-gray-200 pb-2">
                        <span className="text-gray-600">Start Time:</span>
                        <span className="font-semibold text-gray-900">{reviewStartTime}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Expiry Time:</span>
                        <span className="font-semibold text-gray-900">{reviewExpiryTime}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 rounded-xl p-4 sm:p-6 shadow-lg border border-teal-500/30">
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center shadow-inner">
                          <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight drop-shadow-sm">
                            Total Price
                          </h3>
                          <p className="text-xs sm:text-sm text-teal-100/90 font-medium">Your final amount to pay</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-center py-6 sm:py-8 mb-4 sm:mb-6 bg-white/10 backdrop-blur rounded-xl">
                       <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                        {hasActivePromo && (
                          <span className="text-lg sm:text-2xl font-semibold text-white/50 line-through decoration-2">
                            £{quote?.total.toFixed(2)}
                          </span>
                        )}
                        <span className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight drop-shadow-lg">
                          £{finalQuoteTotal.toFixed(2)}
                        </span>
                        {hasActivePromo && (
                           <span className="text-xs sm:text-sm font-bold text-green-200 bg-green-500/40 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full shadow-sm uppercase tracking-wide">
                            {appliedPromo.discount?.type === 'percentage'
                              ? `${appliedPromo.discount.value}% off`
                              : `£${discountAmount.toFixed(2)} off`}
                          </span>
                        )}
                      </div>
                       <p className="text-xs sm:text-sm text-teal-100/80 mt-2 sm:mt-3 font-medium tracking-wide uppercase">
                        Calculated
                      </p>
                    </div>

                    {/* Promo Code Section */}
                    <div className="p-4 sm:p-5 rounded-xl bg-white/10 border border-white/20">
                       <div className="flex items-center space-x-2 mb-2">
                        <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        <span className="text-sm sm:text-base font-bold text-white tracking-tight">Promo Code</span>
                      </div>
                      <p className="text-xs sm:text-sm text-teal-100/90 mb-3 sm:mb-4 font-medium">
                        Have a discount code? Enter it below:
                      </p>
                       <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                        <Input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="ENTER CODE"
                          className="flex-1 h-11 sm:h-12 text-base bg-white/90 border-2 border-teal-300 rounded-lg shadow-sm font-medium outline-none ring-0 focus:border-teal-400 focus:ring-0 focus:outline-none placeholder:text-teal-600/50 appearance-none"
                          style={{ WebkitTapHighlightColor: 'transparent', outline: 'none', boxShadow: 'none', WebkitBoxShadow: 'none' }}
                          disabled={isApplyingPromo || hasActivePromo}
                        />
                        <Button
                          type="button"
                          onClick={handleApplyPromo}
                          className="h-11 sm:h-12 px-6 sm:px-8 bg-white text-teal-700 hover:bg-teal-50 font-bold shadow-sm tracking-tight"
                          disabled={isApplyingPromo || !promoCode.trim() || hasActivePromo}
                        >
                          {isApplyingPromo ? "Applying..." : "Apply"}
                        </Button>
                      </div>
                       {hasActivePromo && (
                        <div className="mt-2 text-xs text-white">
                          Promo "{appliedPromo.promoCode}" applied!{" "}
                          <button onClick={handleRemovePromo} className="underline">
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={handleChangeDetails}
                      variant="outline"
                      className="flex-1 h-12 border-2 border-gray-300 hover:border-teal-500 hover:bg-teal-50 text-gray-700 font-semibold bg-white"
                    >
                      Change Details
                    </Button>
                    <Button
                      onClick={handleProceedToPayment}
                      disabled={isCalculating}
                      className="flex-1 h-12 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold shadow-lg"
                    >
                      {isCalculating ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        "Proceed to Payment"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          {!showQuote && !showReview && (
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-8">
              {/* Duration and Timing */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-gray-100 hover:border-teal-200 transition-colors">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-teal-600" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Duration & Timing</h2>
                </div>

                {/* Duration Type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
                    DURATION TYPE?
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Hours", "Days", "Weeks"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleDurationTypeChange(type)}
                        className={`py-3 rounded-lg font-medium transition-colors text-base ${
                          formData.durationType === type
                            ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Amount */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
                    HOW LONG?
                  </label>

                  {!formData.showDurationDropdown ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {formData.durationType === "Hours" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("1 hour")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "1 hour"
                                ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                          >
                            1 hour
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("3 hours")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "3 hours"
                                ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                          >
                            3 hours
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("5 hours")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "5 hours"
                                ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                          >
                            5 hours
                          </button>
                          <button
                            type="button"
                            onClick={handleOtherDurationClick}
                            className="py-3 rounded-lg font-medium transition-colors text-base bg-gray-100 text-gray-800 hover:bg-gray-200"
                          >
                            Other
                          </button>
                        </>
                      )}

                      {formData.durationType === "Days" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("1 day")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "1 day"
                                ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                          >
                            1 day
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("3 days")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "3 days"
                                ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                          >
                            3 days
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("7 days")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "7 days"
                                ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                          >
                            7 days
                          </button>
                          <button
                            type="button"
                            onClick={handleOtherDurationClick}
                            className="py-3 rounded-lg font-medium transition-colors text-base bg-gray-100 text-gray-800 hover:bg-gray-200"
                          >
                            Other
                          </button>
                        </>
                      )}

                      {formData.durationType === "Weeks" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("1 week")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "1 week"
                                ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                          >
                            1 week
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("2 weeks")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "2 weeks"
                                ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                          >
                            2 weeks
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("3 weeks")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "3 weeks"
                                ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                          >
                            3 weeks
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDurationChange("4 weeks")}
                            className={`py-3 rounded-lg font-medium transition-colors text-base ${
                              formData.duration === "4 weeks"
                                ? "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                            }`}
                          >
                            4 weeks
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="flex space-x-3">
                      <select
                        value={formData.duration}
                        onChange={(e) => handleDurationChange(e.target.value)}
                        className="flex-1 h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base bg-primary-foreground shadow-sm"
                      >
                        {getDurationOptions().map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            showDurationDropdown: false,
                          }))
                        }
                        className="px-4 py-3 text-base border-2 border-gray-300 hover:border-teal-500 hover:bg-teal-50"
                      >
                        Back
                      </Button>
                    </div>
                  )}
                </div>

                {/* 4. Replace the Start Date section with: */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3 uppercase tracking-wide">
                    WHEN DO YOU WANT TO START?
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    <select
                      value={formData.startDate}
                      onChange={(e) => handleInputChange("startDate", e.target.value)}
                      className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base bg-primary-foreground shadow-sm"
                      required
                    >
                      {generateDateOptions().map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>

                    {showTimeSelection && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                            SELECT HOUR
                          </label>
                          <select
                            value={formData.startHour}
                            onChange={(e) => handleInputChange("startHour", e.target.value)}
                            className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base bg-primary-foreground shadow-sm"
                            required
                          >
                            <option value="">Select hour...</option>
                            {generateHourOptions().map((hour) => (
                              <option key={hour} value={hour}>
                                {hour}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                            SELECT MINUTE
                          </label>
                          <select
                            value={formData.startMinute}
                            onChange={(e) => handleInputChange("startMinute", e.target.value)}
                            className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base bg-primary-foreground shadow-sm"
                            required
                            disabled={!formData.startHour}
                          >
                            <option value="">{formData.startHour ? "Select minute..." : "Select hour first"}</option>
                            {formData.startHour &&
                              generateMinuteOptions(formData.startHour).map((minute) => (
                                <option key={minute} value={minute}>
                                  {minute}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-gray-100 hover:border-teal-200 transition-colors overflow-visible relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-teal-600" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Driver Details</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      TITLE *
                    </label>
                    <select
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      className="w-full h-12 text-base shadow-sm rounded-md border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select title</option>
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Miss">Miss</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                    </select>
                  </div>

                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      FIRST NAME *
                    </label>
                    <Input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="w-full h-12 text-base shadow-sm"
                      required
                    />
                  </div>

                  {/* Middle Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      MIDDLE NAME
                    </label>
                    <Input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => handleInputChange("middleName", e.target.value)}
                      className="w-full h-12 text-base shadow-sm"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      LAST NAME *
                    </label>
                    <Input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      className="w-full h-12 text-base shadow-sm"
                      required
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      DATE OF BIRTH *
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <div>
                        <Input
                          ref={yearInputRef}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={formData.dateOfBirthDay}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 2)
                            handleInputChange("dateOfBirthDay", value)
                            validateAge(value, formData.dateOfBirthMonth, formData.dateOfBirthYear)
                            if (value.length === 2) {
                              monthInputRef.current?.focus()
                            }
                          }}
                          className="w-full h-12 text-base text-center shadow-sm"
                          placeholder="DD"
                          maxLength={2}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          ref={monthInputRef}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={formData.dateOfBirthMonth}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, "").slice(0, 2)
                            if (parseInt(value, 10) > 12) {
                              value = "12"
                            }
                            handleInputChange("dateOfBirthMonth", value)
                            validateAge(formData.dateOfBirthDay, value, formData.dateOfBirthYear)
                            if (value.length === 2) {
                              yearInputRef.current?.focus()
                            }
                          }}
                          className="w-full h-12 text-base text-center shadow-sm"
                          placeholder="MM"
                          maxLength={2}
                          required
                        />
                      </div>
                      <div>
                        <Input
                          ref={yearInputRef}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={formData.dateOfBirthYear}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "").slice(0, 4)
                            handleInputChange("dateOfBirthYear", value)
                            validateAge(formData.dateOfBirthDay, formData.dateOfBirthMonth, value)
                          }}
                          className="w-full h-12 text-base text-center shadow-sm"
                          placeholder="YYYY"
                          maxLength={4}
                          required
                        />
                      </div>
                    </div>
                    {ageError && <p className="text-red-600 text-sm mt-2">{ageError}</p>}
                  </div>

                  {/* Occupation */}
                  <div className="relative z-[999]" style={{ zIndex: 999 }}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      OCCUPATION *
                    </label>
                    <div className="relative">
                      <Input
                        ref={occupationInputRef}
                        type="text"
                        value={occupationSearch}
                        onChange={(e) => {
                          setOccupationSearch(e.target.value)
                          setShowOccupationDropdown(true)
                          const filtered = occupation_list.filter((job) =>
                            job.desc.toLowerCase().includes(e.target.value.toLowerCase()),
                          ).map(o => o.desc);
                          setFilteredOccupations(filtered)
                        }}
                        onFocus={() => setShowOccupationDropdown(true)}
                        onBlur={() => {
                          setTimeout(() => setShowOccupationDropdown(false), 200)
                        }}
                        className="w-full h-12 text-base shadow-sm"
                        placeholder="Start typing your occupation..."
                        required
                      />
                      {showOccupationDropdown && filteredOccupations.length > 0 && (
                        <div
                          className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-2xl max-h-60 overflow-y-auto"
                          style={{ zIndex: 99999 }}
                        >
                          {filteredOccupations.map((occupation) => (
                            <div
                              key={occupation}
                              className="px-4 py-2 hover:bg-teal-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                setOccupationSearch(occupation)
                                handleInputChange("occupation", occupation)
                                setShowOccupationDropdown(false)
                              }}
                            >
                              {occupation}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      PHONE NUMBER *
                    </label>
                    <Input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                      className="w-full h-12 text-base shadow-sm"
                      placeholder="07123456789"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-gray-100 hover:border-teal-200 transition-colors relative z-0">
                {isPostcodeLoading && (
                  <div className="absolute inset-0 rounded-2xl bg-white/80 backdrop-blur-[2px] flex items-center justify-center z-20">
                    <div className="flex items-center space-x-3 text-teal-700 font-semibold">
                      <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      <span>Searching address...</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-teal-600" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Address Information</h2>
                </div>

                <div className="space-y-4 sm:space-6">
                  {/* Postcode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      POSTCODE *
                    </label>
                    <div className="flex space-x-3">
                      <Input
                        type="text"
                        value={formData.postcode}
                        onChange={(e) => {
                          handleInputChange("postcode", e.target.value.toUpperCase())
                          setPostcodeError("")
                        }}
                        className="flex-1 h-12 text-base shadow-sm"
                        placeholder="Enter postcode"
                        required
                      />
                      <Button
                        type="button"
                        onClick={handlePostcodeLookup}
                        disabled={isPostcodeLoading}
                        className="bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white px-6 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isPostcodeLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Searching...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4" />
                            <span>Search</span>
                          </>
                        )}
                      </Button>
                    </div>
                    {postcodeError && <p className="text-red-600 text-sm mt-2">{postcodeError}</p>}
                  </div>

                  {/* Address Selection */}
                  {showAddresses && addresses.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                        SELECT ADDRESS *
                      </label>
                      <select
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base bg-primary-foreground shadow-sm"
                        required
                      >
                        <option value="">Select an address...</option>
                        {addresses.map((address: any, index) => (
                          <option key={index} value={address.address_selector}>
                            {address.address_selector}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {postcodeError && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                        ENTER ADDRESS *
                      </label>
                      <Input
                        type="text"
                        value={formData.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        className="w-full h-12 text-base shadow-sm"
                        placeholder="Enter your full address"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* License Information */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-gray-100 hover:border-teal-200 transition-colors">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">License Information</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* License Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      LICENSE TYPE *
                    </label>
                    <select
                      value={formData.licenseType}
                      onChange={(e) => handleInputChange("licenseType", e.target.value)}
                      className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base bg-primary-foreground shadow-sm"
                      required
                    >
                      <option value="">Select license type...</option>
                      <option value="Full UK">Full UK</option>
                      <option value="Provisional">Provisional</option>
                      <option value="International">International</option>
                      <option value="Full EU">Full EU</option>
                    </select>
                  </div>

                  {/* License Held */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      HOW LONG HELD? *
                    </label>
                    <select
                      value={formData.licenseHeld}
                      onChange={(e) => handleInputChange("licenseHeld", e.target.value)}
                      className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base bg-primary-foreground shadow-sm"
                      required
                    >
                      <option value="">Select duration...</option>
                      <option value="Under 1 Year">Under 1 Year</option>
                      <option value="1-2 Years">1-2 Years</option>
                      <option value="2-4 Years">2-4 Years</option>
                      <option value="5-10 Years">5-10 Years</option>
                      <option value="10+ Years">10+ Years</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-gray-100 hover:border-teal-200 transition-colors">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Car className="w-5 h-5 text-teal-600" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Vehicle Information</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Vehicle Value */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      VEHICLE VALUE *
                    </label>
                    <select
                      value={formData.vehicleValue}
                      onChange={(e) => handleInputChange("vehicleValue", e.target.value)}
                      className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base bg-primary-foreground shadow-sm"
                      required
                    >
                      <option value="">Select vehicle value...</option>
                      <option value="£1,000 - £5,000">£1,000 - £5,000</option>
                      <option value="£5,000 - £10,000">£5,000 - £10,000</option>
                      <option value="£10,000 - £20,000">£10,000 - £20,000</option>
                      <option value="£20,000 - £30,000">£20,000 - £30,000</option>
                      <option value="£30,000 - £50,000">£30,000 - £50,000</option>
                      <option value="£50,000 - £80,000">£50,000 - £80,000</option>
                      <option value="£80,000+">£80,000+</option>
                    </select>
                  </div>

                  {/* Reason for Cover */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 uppercase tracking-wide">
                      REASON *
                    </label>
                    <select
                      value={formData.reason}
                      onChange={(e) => handleInputChange("reason", e.target.value)}
                      className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base bg-primary-foreground shadow-sm"
                      required
                    >
                      <option value="">Select reason for cover...</option>
                      <option value="Borrowing">Borrowing</option>
                      <option value="Buying/Selling/Testing">Buying/Selling/Testing</option>
                      <option value="Learning">Learning</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Vehicle Modifications */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border-2 border-gray-100 hover:border-teal-200 transition-colors">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Car className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Vehicle Modifications</h2>
                    <p className="text-sm text-gray-500 mt-1">Optional - Select any modifications your vehicle has</p>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700 font-medium">
                        Declaring modifications does not affect your quote price. This information is for order accuracy
                        only.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="max-h-96 overflow-y-auto pr-2"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "#e5e7eb #f9fafb",
                  }}
                >
                  {Object.entries(modificationsData).map(([category, modifications]) => (
                    <div key={category} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0">
                      <h3 className="text-base font-semibold text-gray-800 mb-3">{category}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {modifications.map((modification) => (
                          <label
                            key={modification}
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.modifications.includes(modification)}
                              onChange={() => handleModificationToggle(modification)}
                              className="w-4 h-4 appearance-none border-2 border-gray-300 rounded bg-white checked:bg-gray-300 checked:border-gray-300 cursor-pointer focus:ring-2 focus:ring-gray-200 focus:ring-offset-0 relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-xs checked:after:left-0.5 checked:after:top-[-2px]"
                            />
                            <span className="text-sm text-gray-700">{modification}</span>
                          </label>
                        ))}

                        <div className="col-span-1 sm:col-span-2">
                          <label className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={showOtherInput[category] || false}
                              onChange={() => handleOtherToggle(category)}
                              className="w-4 h-4 appearance-none border-2 border-gray-300 rounded bg-white checked:bg-gray-300 checked:border-gray-300 cursor-pointer focus:ring-2 focus:ring-gray-200 focus:ring-offset-0 relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-xs checked:after:left-0.5 checked:after:top-[-2px]"
                            />
                            <span className="text-sm text-gray-700 font-medium">Other (please specify)</span>
                          </label>

                          {showOtherInput[category] && (
                            <div className="mt-2 ml-6">
                              <Input
                                type="text"
                                placeholder="Enter custom modification..."
                                value={customModifications[category] || ""}
                                onChange={(e) => handleCustomModificationChange(category, e.target.value)}
                                className="text-sm"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {formData.modifications.length > 0 && (
                  <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                    <p className="text-sm font-medium text-teal-900 mb-2">
                      Selected Modifications ({formData.modifications.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.modifications.map((mod) => (
                        <span
                          key={mod}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800"
                        >
                          {mod}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-gradient-to-br from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white py-4 px-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl"
                  disabled={!!ageError}
                >
                  Review Details
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
        title="Sign In to Continue"
        description="Sign in or create an account to complete your purchase."
        onSuccess={() => {
          setIsAuthDialogOpen(false)
          setIsLoginCompleted(true)
        }}
        disableRedirect={true}
      />
    </div>
  )
}

const modificationsData = {
  "Audio & Electronics": [
    "Additional screens / headrest displays",
    "Amplifiers",
    "Dashcams (front/rear)",
    "Subwoofers",
    "Upgraded speakers",
  ],
  "Body & Exterior Styling": [
    "Aftermarket grilles",
    "Body kits (full)",
    "Carbon fibre exterior parts",
    "Custom badges / debadging",
    "Dechroming",
    "Diffusers",
    "Paint changes",
    "Side skirts",
    "Smoked/tinted lights",
    "Splitters",
    "Spoilers / wings",
    "Widebody kits",
    "Wraps (full/partial)",
  ],
  "Comfort & Interior": [
    "Bucket seats",
    "Custom ambient lighting",
    "Roll cages",
    "Starlight headliner",
    "Steering wheel upgrades",
    "Upgraded infotainment systems",
    "Upholstery changes (leather/alcantara, re-trim)",
  ],
  "Drivetrain & Engine Performance": [
    "ECU remap / tuning (Stage 1/2/3)",
    "Fuel system upgrades (injectors, HPFP)",
    "Induction kits / performance intakes",
    "Intercooler upgrades",
    "Lightweight pulleys",
    "Nitrous systems",
    "Turbo upgrades / hybrid turbos",
  ],
  "Exhaust System": ["Cat-back systems", "Decat downpipes", "Exhaust tips", "Resonator delete", "Sports cat downpipes"],
  Lighting: [
    "DRL conversions (RGB, sequential)",
    "Fog light upgrades",
    "Headlight upgrades (LED/HID)",
    "Interior LED conversions",
    "Underglow lighting",
  ],
  "Safety & Security": [
    "Anti-hijack systems",
    "Ghost immobiliser",
    "Steering wheel locks/mounts",
    "Tracking systems (S5/S7)",
    "Upgraded alarm systems",
  ],
  "Suspension, Handling & Brakes": [
    "Air suspension",
    "Anti-roll bars",
    "Big brake kits",
    "Brake discs/pads (upgraded)",
    "Coilovers",
    "Lowering springs",
    "Strut braces",
    "Wheel spacers",
  ],
  "Transmission & Structural": [
    "Clutch upgrades",
    "Differential upgrades",
    "Driveshaft upgrades",
    "Tow bars",
    "Transmission tuning (TCU/gearbox map)",
  ],
  "Wheels & Tyres": [
    "Alloy wheels (aftermarket)",
    "Changing wheel size",
    "Tyre changes (performance, wider, stretch)",
    "Run-flat to non–run-flat conversion",
  ],
  Other: ["Roof racks", "Window tints", "Custom 3D/4D plates"],
}
