import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userProfilesTable = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  accountType: text("account_type").notNull().default("personal"),
  currency: text("currency").notNull().default("XOF"),
  mobileMoneyProvider: text("mobile_money_provider"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripePriceId: text("stripe_price_id"),
  subscriptionPlan: text("subscription_plan"),
  subscriptionPeriodEnd: timestamp("subscription_period_end", { withTimezone: true }),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  emailDay1Sent: boolean("email_day1_sent").notNull().default(false),
  emailDay10Sent: boolean("email_day10_sent").notNull().default(false),
  trialReminder30dSent: boolean("trial_reminder_30d_sent").notNull().default(false),
  trialReminder7dSent: boolean("trial_reminder_7d_sent").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserProfileSchema = createInsertSchema(userProfilesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfilesTable.$inferSelect;
