export const calculateDiscountedTotal = (total: number, promo: any) => {
  let discountAmount = 0
  if (promo.discount.type === "percentage") {
    discountAmount = total * (promo.discount.value / 100)
  } else if (promo.discount.type === "fixed") {
    discountAmount = promo.discount.value
  }
  if (promo.maxDiscount) {
    discountAmount = Math.min(discountAmount, parseFloat(promo.maxDiscount))
  }
  return discountAmount
}
