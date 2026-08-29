import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRouter from "./routes/ai.routes.js";
import complaintRouter from "./routes/complaint.routes.js";
import projectRouter from "./routes/project.routes.js";
import ttsRouter from "./routes/tts.routes.js";
import authRouter from "./routes/auth.routes.js";
import gisRouter from "./routes/gis.routes.js";
import feedbackRouter from "./routes/feedback.routes.js";
import analyticsRouter from "./routes/analytics.routes.js";
import scenarioRouter from "./routes/scenario.routes.js";
import floodRouter from "./routes/flood.routes.js";
import blackoutRouter from "./routes/blackout.routes.js";
import mcpClient from "./services/mcpClient.js";

import { isDatabaseAvailable } from "./config/db.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: function(origin, callback) {
    // Allow any origin for hackathon/demo deployment
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/gis", gisRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/complaints", complaintRouter);
app.use("/api/projects", projectRouter);
app.use("/api/scenarios", scenarioRouter);
app.use("/api/flood", floodRouter);
app.use("/api/tts", ttsRouter);
app.use("/api/resilience", blackoutRouter);

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "🚀 Kopargaon Smart City Backend Running"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Verify Database connection
  const dbAvailable = await isDatabaseAvailable();
  if (dbAvailable) {
    console.log(`[DB HEALTH CHECK] ✅ Connected to PostgreSQL database (LIVE MODE)`);
  } else {
    console.warn(`[DB HEALTH CHECK] ⚠️ Database not reachable. Running in FALLBACK MODE (Mock Data)`);
  }
  
  // Verify MCP server connection
  const mcpUrl = process.env.MCP_SERVER_URL || 'http://localhost:7000';
  const mcpAvailable = await mcpClient.isMcpServerAvailable();
  if (mcpAvailable) {
    console.log(`[MCP CLIENT] ✅ Connected to MCP server: ${mcpUrl}`);
  } else {
    console.warn(`[MCP CLIENT] ⚠️ MCP server not reachable at ${mcpUrl}`);
  }
});