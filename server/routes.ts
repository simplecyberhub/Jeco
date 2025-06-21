import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertShareholderApplicationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Submit shareholder application
  app.post("/api/shareholder-application", async (req, res) => {
    try {
      // Validate the request body
      const validatedData = insertShareholderApplicationSchema.parse(req.body);

      // Store the application
      const application =
        await storage.createShareholderApplication(validatedData);

      // Email notifications are now handled client-side for better reliability
      console.log(`New shareholder application submitted: ID ${application.id}, Name: ${application.firstName} ${application.lastName}`);

      res.json({
        success: true,
        applicationId: application.id,
        message: "Application submitted successfully",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors,
        });
      } else {
        console.error("Error submitting application:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  });

  // Get all applications (for admin purposes)
  app.get("/api/shareholder-applications", async (req, res) => {
    try {
      const applications = await storage.getAllShareholderApplications();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch applications",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
