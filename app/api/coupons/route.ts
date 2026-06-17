import { db } from "@/lib/db";
import { coupons } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const isUniqueConstraintError = (error: any): boolean => {
  return typeof error === 'object' && error !== null && error.code === '23505';
};

export async function GET() {
  try {
    const allCoupons = await db.select().from(coupons);
    
    const parsedCoupons = allCoupons.map(coupon => {
      try {
        return {
          ...coupon,
          discount: typeof coupon.discount === 'string' ? JSON.parse(coupon.discount) : coupon.discount,
          restrictions: typeof coupon.restrictions === 'string' ? JSON.parse(coupon.restrictions) : coupon.restrictions,
          matches: typeof coupon.matches === 'string' ? JSON.parse(coupon.matches) : coupon.matches,
        };
      } catch (parseError) {
        console.error(`Failed to parse JSON for coupon with ID ${coupon.id}:`, parseError);
        return { ...coupon, jsonParseError: true, errorDetails: "Invalid JSON format in database fields." };
      }
    });

    return NextResponse.json(parsedCoupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to fetch coupons", cause: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newCouponData = await request.json();
    const [insertedCoupon] = await db.insert(coupons).values({
      ...newCouponData,
      expires: newCouponData.expires || null,
      discount: JSON.stringify(newCouponData.discount),
      restrictions: JSON.stringify(newCouponData.restrictions),
      matches: JSON.stringify(newCouponData.matches),
    }).returning();
    return NextResponse.json(insertedCoupon);
  } catch (error) {
    console.error("Error creating coupon:", error);
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: "A coupon with this promo code already exists." }, { status: 409 });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to create coupon", cause: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...updatedCouponData } = await request.json();
    if (!id) {
        return NextResponse.json({ error: "Coupon ID is required for an update." }, { status: 400 });
    }

    const [updatedCoupon] = await db
      .update(coupons)
      .set({
        ...updatedCouponData,
        expires: updatedCouponData.expires || null,
        discount: JSON.stringify(updatedCouponData.discount),
        restrictions: JSON.stringify(updatedCouponData.restrictions),
        matches: JSON.stringify(updatedCouponData.matches),
      })
      .where(eq(coupons.id, id))
      .returning();

    if (!updatedCoupon) {
        return NextResponse.json({ error: `Coupon with ID ${id} not found.` }, { status: 404 });
    }

    return NextResponse.json(updatedCoupon);
  } catch (error) {
    console.error("Error updating coupon:", error);
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: "A coupon with this promo code already exists." }, { status: 409 });
    }
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to update coupon", cause: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
        return NextResponse.json({ error: "Coupon ID is required for deletion." }, { status: 400 });
    }
    const deletedCoupons = await db.delete(coupons).where(eq(coupons.id, id)).returning();

    if (deletedCoupons.length === 0) {
        return NextResponse.json({ error: `Coupon with ID ${id} not found.` }, { status: 404 });
    }

    return NextResponse.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: "Failed to delete coupon", cause: errorMessage }, { status: 500 });
  }
}