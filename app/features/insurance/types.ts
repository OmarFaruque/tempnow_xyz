/** Payload stored by the quote form and consumed by checkout. */
export interface CheckoutQuote {
    userId: string
    total: number
    originalTotal: number
    cpw: string
    update_price: string
    discountAmount: number
    promoCode?: string
    startTime: string
    expiryTime: string
    vehicleModifications: string
    nameTitle: string
    breakdown: { duration: string; reason: string }
    customerData: {
        firstName: string
        middleName: string
        title: string
        lastName: string
        dateOfBirth: string
        phoneNumber: string
        occupation: string
        address: string
        licenseType: string
        licenseHeld: string
        vehicleValue: string
        reason: string
        duration: string
        registration: string
        post_code: string
        vehicle: { make: string; model: string; year: string; engineCC: string }
    }
}
