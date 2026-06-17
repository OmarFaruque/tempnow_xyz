import { db } from "@/lib/db";
import { settings } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function getLemonSqueezySettings() {
    const lemonSqueezySettings = await db.query.settings.findFirst({
        where: eq(settings.param, 'lemonsqueezy'),
    });

    if (!lemonSqueezySettings) {
        throw new Error("Lemon Squeezy settings not found.");
    }

    return JSON.parse(lemonSqueezySettings.value as string);
}
