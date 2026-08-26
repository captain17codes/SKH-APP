import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRouter from "./routes/ai.routes.js";
import complaintRouter from "./routes/complaint.routes.js";
import projectRouter from "./routes/project.routes.js";
import ttsRouter from "./routes/tts.routes.js";
import gisRouter from "./routes/gis.routes.js";
import mcpClient from "./services/mcpClient.js";


dotenv.config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());

app.use("/api/ai", aiRouter);
app.use("/api/complaints", complaintRouter);
app.use("/api/projects", projectRouter);
app.use("/api/tts", ttsRouter);
app.use("/api/gis", gisRouter);

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "🚀 Kopargaon Smart City Backend Running"
  });
});

// Centralized error handler to prevent server crashes
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  
  // Verify MCP server connection
  const mcpUrl = process.env.MCP_SERVER_URL || 'http://localhost:7000';
  const mcpAvailable = await mcpClient.isMcpServerAvailable();
  if (mcpAvailable) {
    console.log(`[MCP CLIENT] Connected to MCP server: ${mcpUrl}`);
  }
});