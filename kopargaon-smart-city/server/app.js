import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRouter from "./routes/ai.routes.js";
import complaintRouter from "./routes/complaint.routes.js";
import projectRouter from "./routes/project.routes.js";
import propertyRouter from "./routes/property.routes.js";
import ttsRouter from "./routes/tts.routes.js";
import mcpClient from "./services/mcpClient.js";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use("/api/ai", aiRouter);
app.use("/api/complaints", complaintRouter);
app.use("/api/projects", projectRouter);
app.use("/api/properties", propertyRouter);
app.use("/api/tts", ttsRouter);

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "🚀 Kopargaon Smart City Backend Running"
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