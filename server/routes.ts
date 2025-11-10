import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { insertUserSchema, insertJobSchema, insertEquipmentSchema, insertJobApplicationSchema } from "@shared/schema";
import { z } from "zod";
import fetch from "node-fetch";


// Helper function to generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Extend Express Session Data with custom properties
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ============ Authentication Routes ============
  
  // Send OTP
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { phone } = z.object({ phone: z.string() }).parse(req.body);
      
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await storage.createOtp({ phone, otp, expiresAt });
      
      // In production, send OTP via SMS service
      console.log(`OTP for ${phone}: ${otp}`);
      
      res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });
  
  // Verify OTP and Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { phone, otp, ...userData } = req.body;
      
      // Verify OTP
      const otpRecord = await storage.getOtpByPhone(phone);
      if (!otpRecord || otpRecord.otp !== otp || otpRecord.expiresAt < new Date()) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByPhone(phone);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
      
      // Create user
      const userInput = insertUserSchema.parse({ phone, ...userData });
      const user = await storage.createUser(userInput);
      
      // Delete used OTP
      await storage.deleteOtp(otpRecord.id);
      
      // Set session
      req.session.userId = user.id;
      
      res.json({ success: true, user: { id: user.id, name: user.name, role: user.role, phone: user.phone } });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Registration failed" });
    }
  });
  
  // Verify OTP and Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { phone, otp } = z.object({ 
        phone: z.string(), 
        otp: z.string() 
      }).parse(req.body);
      
      // Verify OTP
      const otpRecord = await storage.getOtpByPhone(phone);
      if (!otpRecord || otpRecord.otp !== otp || otpRecord.expiresAt < new Date()) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }
      
      // Find user
      const user = await storage.getUserByPhone(phone);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Delete used OTP
      await storage.deleteOtp(otpRecord.id);
      
      // Set session
      req.session.userId = user.id;
      
      res.json({ success: true, user: { id: user.id, name: user.name, role: user.role, phone: user.phone } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: "Login failed" });
    }
  });
  
  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json({ user: { id: user.id, name: user.name, role: user.role, phone: user.phone, location: user.location } });
  });
  
  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });
  
  // ============ Job Routes ============
  
  // Create job
  app.post("/api/jobs", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "farmer") {
        return res.status(403).json({ error: "Only farmers can post jobs" });
      }
      
      const jobInput = insertJobSchema.parse({ 
        ...req.body, 
        farmerId: user.id,
        farmName: user.name 
      });
      const job = await storage.createJob(jobInput);
      
      res.json({ success: true, job });
    } catch (error) {
      console.error("Job creation error:", error);
      res.status(400).json({ error: "Failed to create job" });
    }
  });
  
  // Get all jobs
  app.get("/api/jobs", async (req, res) => {
    try {
      const jobs = await storage.getAllJobs();
      res.json({ jobs });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });
  
  // Get jobs by farmer
  app.get("/api/jobs/farmer/:farmerId", async (req, res) => {
    try {
      const jobs = await storage.getJobsByFarmer(req.params.farmerId);
      res.json({ jobs });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch farmer jobs" });
    }
  });
  
  // Get my jobs (farmer only)
  app.get("/api/jobs/my", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const jobs = await storage.getJobsByFarmer(req.session.userId);
      res.json({ jobs });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch jobs" });
    }
  });
  
  // Delete job
  app.delete("/api/jobs/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      if (job.farmerId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      await storage.deleteJob(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete job" });
    }
  });
  
  // Apply to job
  app.post("/api/jobs/:id/apply", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "coolie") {
        return res.status(403).json({ error: "Only workers can apply to jobs" });
      }
      
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }
      
      const applicationInput = insertJobApplicationSchema.parse({
        jobId: req.params.id,
        coolieId: user.id,
      });
      
      const application = await storage.createJobApplication(applicationInput);
      res.json({ success: true, application });
    } catch (error) {
      console.error("Application error:", error);
      res.status(400).json({ error: "Failed to apply to job" });
    }
  });
  
  // Get applications for a job
  app.get("/api/jobs/:id/applications", async (req, res) => {
    try {
      const applications = await storage.getJobApplicationsByJob(req.params.id);
      res.json({ applications });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });
  
  // Get my applications (coolie only)
  app.get("/api/applications/my", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const applications = await storage.getJobApplicationsByCoolie(req.session.userId);
      res.json({ applications });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });
  
  // ============ Equipment Routes ============
  
  // Create equipment
  app.post("/api/equipment", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user || user.role !== "rental") {
        return res.status(403).json({ error: "Only rental providers can list equipment" });
      }
      
      const equipmentInput = insertEquipmentSchema.parse({ 
        ...req.body, 
        ownerId: user.id 
      });
      const equipment = await storage.createEquipment(equipmentInput);
      
      res.json({ success: true, equipment });
    } catch (error) {
      console.error("Equipment creation error:", error);
      res.status(400).json({ error: "Failed to create equipment" });
    }
  });
  
  // Get all equipment
  app.get("/api/equipment", async (req, res) => {
    try {
      const equipment = await storage.getAllEquipment();
      res.json({ equipment });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });
  
  // Get equipment by owner
  app.get("/api/equipment/owner/:ownerId", async (req, res) => {
    try {
      const equipment = await storage.getEquipmentByOwner(req.params.ownerId);
      res.json({ equipment });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });
  
  // Get my equipment (rental provider only)
  app.get("/api/equipment/my", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const equipment = await storage.getEquipmentByOwner(req.session.userId);
      res.json({ equipment });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });
  
  // Update equipment
  app.patch("/api/equipment/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const equipment = await storage.getEquipment(req.params.id);
      if (!equipment) {
        return res.status(404).json({ error: "Equipment not found" });
      }
      
      if (equipment.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      const updatedEquipment = await storage.updateEquipment(req.params.id, req.body);
      res.json({ success: true, equipment: updatedEquipment });
    } catch (error) {
      res.status(400).json({ error: "Failed to update equipment" });
    }
  });
  
  // Delete equipment
  app.delete("/api/equipment/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const equipment = await storage.getEquipment(req.params.id);
      if (!equipment) {
        return res.status(404).json({ error: "Equipment not found" });
      }
      
      if (equipment.ownerId !== req.session.userId) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      await storage.deleteEquipment(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete equipment" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
// ---- CHAT ROUTE ----
export async function chatHandler(req, res) {
  try {
    const { messages } = req.body;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Reply in the same language as user." },
          ...messages,
        ],
      }),
    });

    const data = await r.json();
    console.log("OPENAI RESPONSE:", data);
    return res.json({ reply: data.choices[0].message.content });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
