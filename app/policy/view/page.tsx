import { redirect } from "next/navigation"

type SearchParams = {
  number?: string | string[]
}

const toSingleValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value

export default function LegacyPolicyViewRedirect({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const policyNumber = toSingleValue(searchParams.number)
  const target = policyNumber
    ? `/order/view?number=${encodeURIComponent(policyNumber)}`
    : "/order/view"

  redirect(target)
}
