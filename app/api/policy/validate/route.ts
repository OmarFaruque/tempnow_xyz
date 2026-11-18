import { NextResponse } from 'next/server'
import { isDatabaseConfigured } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { policyNumber, surname, dateOfBirth, postcode } = await request.json()

    if (!policyNumber || !surname || !dateOfBirth) {
      return NextResponse.json({ error: 'Missing required validation fields' }, { status: 400 })
    }

    // If database is not configured, return a mock response for development
    if (!isDatabaseConfigured()) {
      return NextResponse.json({ 
        isValid: false, 
        error: 'Database not configured in development environment' 
      }, { status: 503 })
    }

    // Dynamic imports to avoid initializing database at module load time
    const { validatePolicyAccess, getPolicyByNumber } = await import('@/lib/policy-server')

    // If postcode is provided, validate normally
    // If postcode is not provided, check if the quote's postcode is valid
    // If quote's postcode is invalid, skip postcode validation
    let result
    if (postcode && postcode.trim()) {
      result = await validatePolicyAccess(policyNumber, surname, dateOfBirth, postcode)
    } else {
      // Postcode not provided - check if quote's postcode is valid
      const policy = await getPolicyByNumber(policyNumber)
      if (!policy) {
        return NextResponse.json({ isValid: false, error: "Policy not found" }, { status: 404 })
      }
      
      const quotePostcode = policy.postCode
      // If quote has no postcode or it's empty, we can't validate
      if (!quotePostcode || !quotePostcode.trim()) {
        return NextResponse.json({ isValid: false, error: "Postcode is required for verification" }, { status: 400 })
      }
      
      // Check if quote's postcode is a valid UK postcode format
      const isValidUkPostcode = (pc: string) => /^[A-Z]{1,2}[0-9][0-9A-Z]?\s?[0-9][A-Z]{2}$/i.test(pc.trim())
      
      if (!isValidUkPostcode(quotePostcode)) {
        // Quote's postcode is invalid/custom - validate without postcode
        result = await validatePolicyAccessWithoutPostcode(policyNumber, surname, dateOfBirth)
      } else {
        // Quote's postcode is valid format - postcode is required
        return NextResponse.json({ isValid: false, error: "Postcode is required for verification" }, { status: 400 })
      }
    }

    if (result.isValid) {
      // Only return a success status, not the full policy data
      return NextResponse.json({ isValid: true })
    } else {
      // Return the specific error message for logging, but the client should use a generic message
      return NextResponse.json({ isValid: false, error: result.error }, { status: 401 })
    }
  } catch (error) {
    console.error("Docs validation API error:", error);
    return NextResponse.json({ error: 'An internal server error occurred' }, { status: 500 })
  }
}


// Validate policy access without postcode (for cases where quote's postcode is invalid)
async function validatePolicyAccessWithoutPostcode(
  policyNumber: string,
  surname: string,
  dateOfBirth: string
): Promise<{ isValid: boolean; policy?: any; error?: string }> {
  const { getPolicyByNumber } = await import('@/lib/policy-server')
  const policy = await getPolicyByNumber(policyNumber)
  
  if (!policy) {
    return { isValid: false, error: "Policy not found" }
  }

  // Validate surname (case insensitive)
  if (policy.lastName?.toLowerCase() !== surname.toLowerCase().trim()) {
    return { isValid: false, error: "Surname does not match our records" }
  }

  if (!policy.dateOfBirth) {
    return { isValid: false, error: "Date of birth is missing in the policy record" }
  }

  // Validate date of birth
  const policyDateOfBirth = policy.dateOfBirth.split(' ')[0] // Extract date part only
  const inputDateOfBirth = dateOfBirth // Input is already in YYYY-MM-DD format

  if (policyDateOfBirth !== inputDateOfBirth) {
    return { isValid: false, error: "Date of birth does not match our records" }
  }

  // Skip postcode validation
  return { isValid: true, policy }
}