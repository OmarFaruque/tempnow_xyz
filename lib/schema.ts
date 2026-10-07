import { pgTable, unique, serial, varchar, text, timestamp, boolean, json, jsonb, integer, numeric, uuid, index } from "drizzle-orm/pg-core"




export const admins = pgTable("admins", {
	adminId: serial("admin_id").primaryKey().notNull(),
	fname: varchar({ length: 255 }),
	lname: varchar({ length: 255 }),
	email: varchar({ length: 255 }),
	phone: varchar({ length: 255 }),
	password: text(),
	role: varchar({ length: 50 }),
	rememberToken: text("remember_token"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("admins_email_unique").on(table.email),
]);

export const users = pgTable("users", {
	userId: serial("user_id").primaryKey().notNull(),
	email: varchar({ length: 255 }),
	stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
	squareCustomerId: varchar("square_customer_id", { length: 255 }),
	emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true, mode: 'string' }),
	password: text(),
	rememberToken: text("remember_token"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	firstName: varchar("first_name", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	verificationCodeHash: text("verification_code_hash"),
	verificationCodeExpiresAt: timestamp("verification_code_expires_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const settings = pgTable('settings', {
	param: text('param').primaryKey(), // e.g., 'mot_token'
	value: text('value'),             // Will store the JSON string with token and timestamp
});

export const quotes = pgTable("quotes", {
	id: serial("id").primaryKey().notNull(),
	policyNumber: varchar("policy_number", { length: 255 }).notNull(),
	userId: varchar("user_id", { length: 255 }),
	cpw: varchar("cpw", { length: 255 }),
	updatePrice: varchar("update_price").default('0'),
	regNumber: varchar("reg_number", { length: 50 }),
	vehicleMake: varchar("vehicle_make", { length: 100 }),
	vehicleModel: varchar("vehicle_model", { length: 100 }),
	engineCC: varchar("engine_cc", { length: 50 }),
	startDate: timestamp("start_date", { mode: 'string' }),
	endDate: timestamp("end_date", { mode: 'string' }),
	dateOfBirth: timestamp("date_of_birth", { mode: 'string' }),
	firstName: varchar("first_name", { length: 100 }),
	lastName: varchar("last_name", { length: 100 }),
	phone: varchar("phone", { length: 50 }),
	licenceType: varchar("licence_type", { length: 50 }),
	licencePeriod: varchar("licence_period", { length: 50 }),
	vehicleType: varchar("vehicle_type", { length: 100 }),
	promoCode: varchar("promo_code", { length: 100 }),
	paymentStatus: varchar("payment_status", { length: 50 }), // e.g., 'pending', 'paid'
	intentId: varchar("intent_id", { length: 255 }), // Payment intent ID from payment gateway
	spaymentId: varchar("spayment_id", { length: 255 }), // Square payment ID
	nameTitle: varchar("name_title", { length: 20 }),
	vehicleModifications: json("vehicle_modifications"),
	postCode: varchar("post_code", { length: 20 }),
	address: text("address"),
	town: varchar("town", { length: 100 }),
	occupation: varchar("occupation", { length: 100 }),
	coverReason: varchar("cover_reason", { length: 255 }),
	mailSent: boolean("mail_sent").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	quoteData: text("quote_data"), // Storing as JSON string
	status: varchar("status", { length: 50 }).default('pending').notNull(), // e.g., 'pending', 'completed'
	paymentIntentId: varchar("payment_intent_id", { length: 255 }),
	paymentMethod: varchar("payment_method", { length: 50 }), // e.g., 'stripe', 'square'
	paymentDate: timestamp("payment_date", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	expiryEmailSent: boolean("expiry_email_sent").default(false),

	// Fraud detection fields (added for FraudLabsPro integration)
	fraudStatus: varchar("fraud_status", { length: 50 }).default('ok'), // 'ok' | 'warning' | 'blocked'
	fraudScore: integer("fraud_score"),
	fraudDetails: json("fraud_details"),
	fraudCheckedAt: timestamp("fraud_checked_at", { mode: 'string' }),
	fraudNote: text("fraud_note"),

});

export const coupons = pgTable("coupons", {
	id: serial("id").primaryKey().notNull(),
	promoCode: varchar("promo_code", { length: 100 }).notNull(),
	caseSensitive: boolean("case_sensitive").default(false).notNull(),
	discount: json("discount").notNull(), // { type: 'percentage' | 'fixed', value: number }
	minSpent: varchar("min_spent", { length: 50 }), // e.g., '100' for $100
	maxDiscount: varchar("max_discount", { length: 50 }), // e.g., '50' for $50
	quotaAvailable: varchar("quota_available", { length: 50 }).notNull(),
	usedQuota: varchar("used_quota", { length: 50 }).default('0').notNull(),
	totalUsage: varchar("total_usage", { length: 50 }).default('0').notNull(),
	expires: timestamp("expires", { mode: 'string' }),
	isActive: boolean("is_active").default(true).notNull(),
	restrictions: json("restrictions"), // JSON string for any additional restrictions
	matches: json("matches"), // JSON string for matching criteria
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const tickets = pgTable("tickets", {
	id: serial("id").primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }),
	firstName: varchar("first_name", { length: 255 }).notNull(),
	lastName: varchar("last_name", { length: 255 }).notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	token: varchar("token", { length: 100 }).notNull(),
	policyNumber: varchar("policy_number", { length: 100 }),
	unread: boolean("unread").default(true).notNull(),
	isClosed: boolean("is_closed").default(false).notNull(),
	subject: varchar("subject", { length: 255 }).notNull(),
	status: varchar("status", { length: 50 }).default('open').notNull(), // e.g., 'open', 'closed', 'pending'
	priority: varchar("priority", { length: 50 }).default('normal').notNull(), // e.g., 'low', 'normal', 'high'
	assignedTo: varchar("assigned_to", { length: 255 }), // adminId of the assigned admin
	discordChannelId: varchar("discord_channel_id", { length: 255 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("tickets_discord_channel_id_unique").on(table.discordChannelId),
]);

export const messages = pgTable("messages", {
	id: serial("id").primaryKey().notNull(),
	ticketId: integer("ticket_id").references(() => tickets.id).notNull(),
	messageId: varchar("message_id", { length: 255 }).notNull(),
	message: text("message").notNull(),
	isAdmin: boolean("is_admin").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const blacklist = pgTable("blacklist", {
	id: serial("id").primaryKey().notNull(),
	type: varchar("type", { length: 50 }).notNull(), // 'user', 'ip', 'postcode', 'address', 'reg_number'

	// Fields for 'user' type
	firstName: varchar("first_name", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	email: varchar("email", { length: 255 }),
	dateOfBirth: varchar("date_of_birth", { length: 255 }),
	operator: varchar("operator", { length: 10 }).default('AND'), // 'AND' or 'OR'

	// Field for 'ip' type
	ipAddress: varchar("ip_address", { length: 255 }),

	// Field for 'postcode' type
	postcode: varchar("postcode", { length: 50 }),

	// Field for 'reg_number' type
	regNumber: varchar("reg_number", { length: 50 }),

	// Field for 'address' type
	address: text("address"),

	// Common fields
	reason: text("reason"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

// The one-off "pay per AI document" table (`ai_documents`) was retired: the
// document product now lives in `documents` + `templates` + `categories` with
// credits/subscriptions (drizzle/0009_doc_service_tables.sql). Migration
// 0011_drop_ai_documents.sql drops the table after
// `scripts/export-ai-documents.mjs` has exported its rows.

export const paymentGatewayAttempts = pgTable("payment_gateway_attempts", {
	id: uuid("id").primaryKey().notNull(),
	checkoutId: text("checkout_id").notNull(),
	product: varchar("product", { length: 32 }).notNull(),
	gateway: varchar("gateway", { length: 32 }).notNull(),
	customerKey: varchar("customer_key", { length: 64 }).notNull(),
	attemptNumber: integer("attempt_number").notNull(),
	status: varchar("status", { length: 24 }).default('reserved').notNull(),
	providerReference: text("provider_reference"),
	failureCode: varchar("failure_code", { length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
}, (table) => [
	unique("payment_gateway_attempts_checkout_number_unique").on(table.checkoutId, table.product, table.attemptNumber),
	index("payment_gateway_attempts_gateway_status_idx").on(table.gateway, table.status, table.createdAt),
	index("payment_gateway_attempts_customer_gateway_idx").on(table.customerKey, table.gateway, table.createdAt),
]);

export const paddleRefundEvents = pgTable("paddle_refund_events", {
	id: serial("id").primaryKey().notNull(),
	paddleEventId: varchar("paddle_event_id", { length: 255 }),
	eventName: varchar("event_name", { length: 100 }),
	eventType: varchar("event_type", { length: 50 }).notNull(), // refund | chargeback
	status: varchar("status", { length: 50 }),
	firstName: varchar("first_name", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	email: varchar("email", { length: 255 }),
	policyNumber: varchar("policy_number", { length: 255 }),
	amount: numeric("amount"),
	currency: varchar("currency", { length: 20 }),
	transactionId: varchar("transaction_id", { length: 255 }),
	address: text("address"),
	reason: text("reason"),
	payload: json("payload"),
	blacklistedAt: timestamp("blacklisted_at", { mode: 'string' }),
	blacklistedTargets: varchar("blacklisted_targets", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("paddle_refund_events_paddle_event_id_unique").on(table.paddleEventId),
]);
// ---------------------------------------------------------------------------
// Document service tables (merged from the former letterise database,
// migration 0009). Purchase/catalogue records only - identities live in
// "users" above. Accessed via raw SQL from features/documents/services.
// ---------------------------------------------------------------------------
export const docCategories = pgTable("categories", {
	id: serial("id").primaryKey().notNull(),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	description: text("description"),
	icon: text("icon"),
	displayOrder: integer("display_order").default(0).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
});

export const docTemplates = pgTable("templates", {
	id: serial("id").primaryKey().notNull(),
	categoryId: integer("category_id").notNull().references(() => docCategories.id, { onDelete: 'cascade' }),
	name: text("name").notNull(),
	slug: text("slug").notNull().unique(),
	description: text("description"),
	useCases: jsonb("use_cases"),
	systemPrompt: text("system_prompt").notNull(),
	questions: jsonb("questions"),
	estimatedLength: text("estimated_length"),
	isFeatured: boolean("is_featured").default(false).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const docDocuments = pgTable("documents", {
	id: serial("id").primaryKey().notNull(),
	userId: integer("user_id").notNull().references(() => users.userId, { onDelete: 'cascade' }),
	templateId: integer("template_id").references(() => docTemplates.id, { onDelete: 'set null' }),
	title: text("title").notNull(),
	content: text("content").notNull(),
	userInputs: jsonb("user_inputs"),
	status: text("status").default('draft').notNull(),
	creditsUsed: integer("credits_used").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const docSubscriptionPlans = pgTable("subscription_plans", {
	id: serial("id").primaryKey().notNull(),
	name: text("name").notNull(),
	description: text("description"),
	badge: text("badge"),
	planType: text("plan_type").notNull(),
	priceCents: integer("price_cents").default(0).notNull(),
	packagePriceCents: integer("package_price_cents"),
	pricePerDocumentCents: integer("price_per_document_cents"),
	creditAmount: integer("credit_amount"),
	monthlyDocumentLimit: integer("monthly_document_limit"),
	discountPercent: numeric("discount_percent"),
	features: jsonb("features"),
	creditsPerMonth: integer("credits_per_month"),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const docUserSubscriptions = pgTable("user_subscriptions", {
	id: serial("id").primaryKey().notNull(),
	userId: integer("user_id").notNull().references(() => users.userId, { onDelete: 'cascade' }),
	planId: integer("plan_id").notNull().references(() => docSubscriptionPlans.id, { onDelete: 'cascade' }),
	provider: text("provider").default('stripe').notNull(),
	providerSubscriptionId: text("provider_subscription_id"),
	checkoutId: text("checkout_id"),
	status: text("status").notNull(),
	currentPeriodStart: timestamp("current_period_start", { withTimezone: true, mode: 'string' }),
	currentPeriodEnd: timestamp("current_period_end", { withTimezone: true, mode: 'string' }),
	cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const docUserCredits = pgTable("user_credits", {
	id: serial("id").primaryKey().notNull(),
	userId: integer("user_id").notNull().references(() => users.userId, { onDelete: 'cascade' }).unique(),
	creditsAvailable: integer("credits_available").default(0).notNull(),
	creditsUsed: integer("credits_used").default(0).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const docTransactions = pgTable("transactions", {
	id: serial("id").primaryKey().notNull(),
	userId: integer("user_id").notNull().references(() => users.userId, { onDelete: 'cascade' }),
	provider: text("provider").default('stripe').notNull(),
	providerPaymentId: text("provider_payment_id"),
	checkoutId: text("checkout_id"),
	amountCents: integer("amount_cents"),
	creditsPurchased: integer("credits_purchased"),
	transactionType: text("transaction_type"),
	status: text("status").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});