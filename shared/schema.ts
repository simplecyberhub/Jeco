import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const shareholderApplications = pgTable("shareholder_applications", {
  id: serial("id").primaryKey(),
  // Personal Information
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  ssn: text("ssn").notNull(),
  
  // Contact Information
  streetAddress: text("street_address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  phoneNumber: text("phone_number").notNull(),
  emailAddress: text("email_address").notNull(),
  
  // Investment Information
  investmentAmount: decimal("investment_amount").notNull(),
  shareClass: text("share_class").notNull(),
  paymentMethod: text("payment_method").notNull(),
  expectedIncome: text("expected_income"),
  
  // Industry Experience
  industryExperience: text("industry_experience").notNull(),
  businessBackground: text("business_background").array(),
  
  // Investment Objectives
  investmentObjective: text("investment_objective").notNull(),
  riskTolerance: text("risk_tolerance").notNull(),
  timeHorizon: text("time_horizon").notNull(),
  
  // Legal & Compliance
  acknowledgments: text("acknowledgments").array().notNull(),
  electronicSignature: text("electronic_signature").notNull(),
  
  // Metadata
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  status: text("status").default("pending").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertShareholderApplicationSchema = createInsertSchema(shareholderApplications).omit({
  id: true,
  submittedAt: true,
  status: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ShareholderApplication = typeof shareholderApplications.$inferSelect;
export type InsertShareholderApplication = z.infer<typeof insertShareholderApplicationSchema>;
