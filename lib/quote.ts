export function calculateQuote(quoteFormula, formData) {
    if (!quoteFormula) return null;

    const {
      baseHourRate,
      baseAdditionalHourRate,
      baseDayRate,
      baseAdditionalDayRate,
      baseWeekRate,
      baseAdditionalWeekRate,
      baseFourWeekRate,
      ageDiscountRanges,
      licenseDiscounts,
      enableMinimumRates,
      minimumHourRate,
      minimumDayRate,
      minimumWeekRate,
      minimumFourWeekRate,
      minimumAdditionalHourRate,
      minimumAdditionalDayRate,
      minimumAdditionalWeekRate
    } = quoteFormula;

    const durationValue = Number.parseInt(formData.duration.split(" ")[0]);
    let basePrice = 0;
    let durationType = formData.durationType;
    let unitQuantity = 1; // Track the number of units for per-unit rate calculation

    if (formData.durationType === "Hours") {
      unitQuantity = durationValue;
      if (durationValue === 1) {
        basePrice = Number.parseFloat(baseHourRate);
      } else if (durationValue < 24) {
        basePrice = Number.parseFloat(baseHourRate) + (durationValue - 1) * Number.parseFloat(baseAdditionalHourRate);
      } else {
        // Convert to days if 24+ hours
        const days = Math.ceil(durationValue / 24);
        unitQuantity = days;
        if (days === 1) {
          basePrice = Number.parseFloat(baseDayRate);
        } else {
          basePrice = Number.parseFloat(baseDayRate) + (days - 1) * Number.parseFloat(baseAdditionalDayRate);
        }
        durationType = "Days";
      }
    } else if (formData.durationType === "Days") {
      unitQuantity = durationValue;
      if (durationValue < 7) { // For durations less than a week, use standard daily rates
        if (durationValue === 1) {
          basePrice = Number.parseFloat(baseDayRate);
        } else {
          basePrice = Number.parseFloat(baseDayRate) + (durationValue - 1) * Number.parseFloat(baseAdditionalDayRate);
        }
      } else { // For durations of 7 days or more, convert to weeks and days
        const weeks = Math.floor(durationValue / 7);
        const remainingDays = durationValue % 7;

        

        let weekPrice = 0;
        if (weeks > 0) {
          if (weeks === 4 && remainingDays === 0) {
            // Apply special 4-week rate if duration is exactly 28 days
            weekPrice = Number.parseFloat(baseFourWeekRate);
          } else {
            // Calculate price for the full weeks
            weekPrice = Number.parseFloat(baseWeekRate) + (weeks - 1) * Number.parseFloat(baseAdditionalWeekRate);
          }
        }

        

        let dayPrice = 0;
        if (remainingDays > 0) {
          // If a week rate is applied, all subsequent days are charged at the additional day rate.
          dayPrice = remainingDays * Number.parseFloat(baseAdditionalDayRate);
        }

        

        basePrice = weekPrice + dayPrice;
        
      }
    } else if (formData.durationType === "Weeks") {
      unitQuantity = durationValue;
      if (durationValue === 4) {
        basePrice = Number.parseFloat(baseFourWeekRate);
      } else if (durationValue === 1) {
        basePrice = Number.parseFloat(baseWeekRate);
      } else {
        basePrice = Number.parseFloat(baseWeekRate) + (durationValue - 1) * Number.parseFloat(baseAdditionalWeekRate);
      }
    }


    // Age calculation
    const currentYear = new Date().getFullYear();
    const birthYear = Number.parseInt(formData.dateOfBirthYear);
    const age = currentYear - birthYear;

    // Age discount calculation
    let ageDiscountAmount = 0;
    if (ageDiscountRanges) {
      for (const range of ageDiscountRanges) {
        const minAge = Number.parseFloat(range.minAge);
        const maxAge = Number.parseFloat(range.maxAge);
        const multiplier = Number.parseFloat(range.multiplier);

        if (age >= minAge && age <= maxAge) {
          ageDiscountAmount = (age - 17) * multiplier;
          break;
        }
      }
      if (age > 80 && ageDiscountRanges.length > 0) {
        const lastRange = ageDiscountRanges[ageDiscountRanges.length - 1];
        ageDiscountAmount = (80 - 17) * Number.parseFloat(lastRange.multiplier);
      }
    }

    // License experience discount
    let licenseDiscountPercentage = 0;
    if (licenseDiscounts) {
        const licenseDiscount = licenseDiscounts.find((d) => d.range === formData.licenseHeld);
        if (licenseDiscount) {
            licenseDiscountPercentage = licenseDiscount.discount;
        }
    }

    // Calculate total
    const priceAfterAgeDiscount = basePrice - ageDiscountAmount;
    const licenseDiscountAmount = priceAfterAgeDiscount * (licenseDiscountPercentage / 100);
    let total = priceAfterAgeDiscount - licenseDiscountAmount;

    // Apply minimum rates if enabled by calculating a separate minimum price floor
    if (enableMinimumRates) {
      let minimumPrice = 0;
      const minHourRate = Number.parseFloat(minimumHourRate) || 0;
      const minAdditionalHourRate = Number.parseFloat(minimumAdditionalHourRate) || 0;
      const minDayRate = Number.parseFloat(minimumDayRate) || 0;
      const minAdditionalDayRate = Number.parseFloat(minimumAdditionalDayRate) || 0;
      const minWeekRate = Number.parseFloat(minimumWeekRate) || 0;
      const minAdditionalWeekRate = Number.parseFloat(minimumAdditionalWeekRate) || 0;
      const minFourWeekRate = Number.parseFloat(minimumFourWeekRate) || 0;

      // Use the final durationType and unitQuantity calculated during the basePrice phase
      if (durationType === "Hours") {
        if (unitQuantity === 1) {
          minimumPrice = minHourRate;
        } else {
          minimumPrice = minHourRate + (unitQuantity - 1) * minAdditionalHourRate;
        }
      } else if (durationType === "Days") {
        if (unitQuantity < 7) { // Standard minimum day-based calculation
          if (unitQuantity === 1) {
            minimumPrice = minDayRate;
          } else {
            minimumPrice = minDayRate + (unitQuantity - 1) * minAdditionalDayRate;
          }
        } else { // Convert days to weeks for minimum price calculation
          const weeks = Math.floor(unitQuantity / 7);
          const remainingDays = unitQuantity % 7;

          let weekPrice = 0;
          if (weeks > 0) {
            if (weeks === 4 && remainingDays === 0) {
              weekPrice = minFourWeekRate;
            } else {
              weekPrice = minWeekRate + (weeks - 1) * minAdditionalWeekRate;
            }
          }

          let dayPrice = 0;
          if (remainingDays > 0) {
            dayPrice = remainingDays * minAdditionalDayRate;
          }
          minimumPrice = weekPrice + dayPrice;
        }
      } else if (durationType === "Weeks") {
        if (unitQuantity === 4) {
          minimumPrice = minFourWeekRate;
        } else if (unitQuantity === 1) {
          minimumPrice = minWeekRate;
        } else {
          minimumPrice = minWeekRate + (unitQuantity - 1) * minAdditionalWeekRate;
        }
      }

      if (minimumPrice > 0) {
        total = Math.max(total, minimumPrice);
      }
    }

    // Apply global minimum premium of £8.50 if total is less
    total = Math.max(total, 8.5);


    

    return {
      basePrice,
      ageDiscountAmount,
      licenseDiscountAmount,
      total,
      breakdown: {
        age,
        duration: `${durationValue} ${durationValue === 1 ? durationType.toLowerCase().slice(0, -1) : durationType.toLowerCase()}`,
        licenseExperience: formData.licenseHeld,
      },
    };
}