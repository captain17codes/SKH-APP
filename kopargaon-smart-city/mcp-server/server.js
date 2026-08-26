import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import postgresService from './services/postgresService.js';
import spatialAnalysisService from './services/spatialAnalysisService.js';
import projectRiskService from '../server/services/projectRiskService.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// List of available MCP tools & input schemas
const MCP_TOOLS_REGISTRY = [
  {
    name: 'get_ward_details',
    description: 'Fetch demographic, area, and utility stats for a specific Kopargaon municipal ward.',
    inputSchema: {
      type: 'object',
      properties: {
        wardId: { type: 'string', description: 'ID of the ward (e.g., W1, W2, W3, W4, W5, W6)' }
      },
      required: ['wardId']
    }
  },
  {
    name: 'get_projects',
    description: 'Fetch active/planned Smart City projects filtered by ward or status.',
    inputSchema: {
      type: 'object',
      properties: {
        wardId: { type: 'string', description: 'Optional ward filtering ID (e.g., W3, W4)' },
        status: { type: 'string', description: 'Optional status filtering (e.g., PLANNED, APPROVED, IN_PROGRESS, DELAYED, COMPLETED, CANCELLED)' }
      }
    }
  },
  {
    name: 'get_project_details',
    description: 'Fetch detailed scope, budgets, timelines, and departments for a specific project.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID of the project (e.g., PRJ-2026-001 or project name)' }
      },
      required: ['projectId']
    }
  },
  {
    name: 'get_project_progress',
    description: 'Calculate expected vs actual progress and progress gap for a specific project.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID of the project (e.g., PRJ-2026-001)' }
      },
      required: ['projectId']
    }
  },
  {
    name: 'get_project_budget',
    description: 'Analyze budget utilization and financial expenditure for a specific project.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID of the project (e.g., PRJ-2026-001)' }
      },
      required: ['projectId']
    }
  },
  {
    name: 'get_project_complaints',
    description: 'Fetch nearby unresolved citizen complaints for a project using PostGIS spatial queries.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID of the project (e.g., PRJ-2026-001)' }
      },
      required: ['projectId']
    }
  },
  {
    name: 'analyze_project_risk',
    description: 'Perform deterministic 10-factor AI risk engine analysis on a specific project.',
    inputSchema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: 'ID of the project (e.g., PRJ-2026-001)' }
      },
      required: ['projectId']
    }
  },
  {
    name: 'get_projects_at_risk',
    description: 'Find Smart City projects filtered by ward or risk level (CRITICAL, HIGH, MEDIUM, LOW).',
    inputSchema: {
      type: 'object',
      properties: {
        wardId: { type: 'string', description: 'Optional ward ID (e.g., W4, Ward 4)' },
        riskLevel: { type: 'string', description: 'Optional risk level (CRITICAL, HIGH, MEDIUM, LOW, UNKNOWN)' }
      }
    }
  },
  {
    name: 'get_land_use',
    description: 'Fetch GIS land zoning plots for a specific ward area.',
    inputSchema: {
      type: 'object',
      properties: {
        wardId: { type: 'string', description: 'ID of the ward to query plots for' }
      },
      required: ['wardId']
    }
  },
  {
    name: 'get_nearby_hospitals',
    description: 'Fetch nearby healthcare facilities using radial spatial calculations.',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        radiusMeters: { type: 'number', default: 5000 }
      },
      required: ['latitude', 'longitude']
    }
  },
  {
    name: 'get_nearby_schools',
    description: 'Fetch nearby schools using radial spatial calculations.',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        radiusMeters: { type: 'number', default: 5000 }
      },
      required: ['latitude', 'longitude']
    }
  },
  {
    name: 'get_road_accessibility',
    description: 'Get road network connectivity score for specific coordinate point.',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number' },
        longitude: { type: 'number' }
      },
      required: ['latitude', 'longitude']
    }
  },
  {
    name: 'analyze_infrastructure_gap',
    description: 'Analyze infrastructure gap in a ward based on utility pipeline density, schools, hospitals, and complaints count.',
    inputSchema: {
      type: 'object',
      properties: {
        wardId: { type: 'string', description: 'The ward ID to analyze' }
      },
      required: ['wardId']
    }
  },
  {
    name: 'find_suitable_locations',
    description: 'Perform deterministic spatial suitability analysis for a new public asset in a target ward.',
    inputSchema: {
      type: 'object',
      properties: {
        facilityType: { type: 'string', enum: ['hospital', 'school'], description: 'Type of facility to locate' },
        wardId: { type: 'string', description: 'Target ward ID (e.g. W4)' }
      },
      required: ['facilityType', 'wardId']
    }
  },
  {
    name: 'get_complaints',
    description: 'Fetch registered civic complaints filtered by ward, status, or category.',
    inputSchema: {
      type: 'object',
      properties: {
        wardId: { type: 'string', description: 'Optional ward ID (e.g. W4)' },
        status: { type: 'string', description: 'Optional status (e.g. Pending, In Progress, Resolved)' },
        category: { type: 'string', description: 'Optional category (e.g. Road Damage, Drainage)' }
      }
    }
  },
  {
    name: 'get_nearby_complaints',
    description: 'Fetch citizen complaints near a specific coordinate location within a radial distance.',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number' },
        longitude: { type: 'number' },
        radiusMeters: { type: 'number', default: 1000 }
      },
      required: ['latitude', 'longitude']
    }
  },
  {
    name: 'analyze_complaint_priority',
    description: 'Evaluate AI priority score and reasons for a specific complaint or ward.',
    inputSchema: {
      type: 'object',
      properties: {
        complaintId: { type: 'string', description: 'Complaint ID to analyze' },
        wardId: { type: 'string', description: 'Ward ID to analyze priority issues' }
      }
    }
  }
];

// MCP Server Health Check
app.get('/', (req, res) => {
  res.json({
    success: true,
    service: "Kopargaon Smart City MCP Server",
    status: "running",
    port: 7000
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: "MCP",
    status: "healthy"
  });
});


// JSON-RPC Tool Discovery Endpoint
app.get('/tools', (req, res) => {
  res.json({ tools: MCP_TOOLS_REGISTRY });
});

// Parameterized Tool Execution Engine (used by REST & MCP SSE)
async function executeTool(name, args = {}) {
  let result = null;

  switch (name) {
      case 'get_ward_details': {
        const { wardId } = args;
        const wards = await postgresService.getWards();
        const ward = wards.features.find(f => 
          f.properties.id.toLowerCase() === wardId.toLowerCase() ||
          f.properties.name.toLowerCase().includes(wardId.toLowerCase())
        );
        if (!ward) throw new Error(`Ward ${wardId} not found`);

        const allProj = await postgresService.getProjects();
        const projectsInWard = allProj.filter(p => p.ward && p.ward.toLowerCase().includes(ward.properties.id.toLowerCase()));
        
        let schoolCount = 0;
        let hospitalCount = 0;
        try {
          const filePath = path.resolve(process.cwd(), '../client/src/data/gis/infrastructure.geojson');
          const infraData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          schoolCount = infraData.features.filter(f => f.properties.type === 'school' && f.properties.ward.toLowerCase().includes(ward.properties.id.toLowerCase())).length;
          hospitalCount = infraData.features.filter(f => f.properties.type === 'hospital' && f.properties.ward.toLowerCase().includes(ward.properties.id.toLowerCase())).length;
        } catch {}

        result = {
          id: ward.properties.id,
          number: parseInt(ward.properties.id.replace(/\D/g, '')) || 0,
          name: ward.properties.name,
          population: ward.properties.population,
          area: ward.properties.areaKm2 || 3.5,
          activeProjects: projectsInWard.length,
          schools: schoolCount || ward.properties.schools || 0,
          hospitals: hospitalCount || ward.properties.hospitals || 0,
          complaints: ward.properties.complaintsCount || 0
        };
        break;
      }

      case 'get_projects': {
        const { wardId, status } = args;
        let list = await postgresService.getProjects();
        if (wardId) {
          list = list.filter(p => p.ward && p.ward.toLowerCase().includes(wardId.toLowerCase()));
        }
        if (status) {
          list = list.filter(p => p.status.toLowerCase() === status.toLowerCase());
        }
        result = list.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          status: p.status,
          progress: p.progress,
          budget: p.budget,
          spent: p.spent,
          startDate: p.startDate,
          expectedCompletion: p.expectedCompletion,
          department: p.department,
          ward: p.ward,
          geometry: p.geometry
        }));
        break;
      }

      case 'get_project_details': {
        const { projectId } = args;
        const list = await postgresService.getProjects();
        const project = list.find(p => 
          p.id.toLowerCase() === projectId.toLowerCase() ||
          p.name.toLowerCase().includes(projectId.toLowerCase())
        );
        if (!project) throw new Error(`Project ${projectId} not found`);

        const risk = await projectRiskService.calculateRisk(project);
        result = {
          id: project.id,
          name: project.name,
          category: project.category,
          department: project.department,
          ward: project.ward,
          status: project.status,
          progress: project.progress,
          budget: project.budget,
          spent: project.spent,
          startDate: project.startDate,
          expectedCompletion: project.expectedCompletion || project.endDate,
          description: project.description,
          coordinates: project.coordinates || (project.geometry?.type === 'Point' ? [project.geometry.coordinates[1], project.geometry.coordinates[0]] : null),
          aiRisk: risk.risk,
          riskScore: risk.score,
          riskAnalysis: risk
        };
        break;
      }

      case 'get_project_progress': {
        const { projectId } = args;
        const list = await postgresService.getProjects();
        const project = list.find(p => p.id.toLowerCase() === projectId.toLowerCase() || p.name.toLowerCase().includes(projectId.toLowerCase()));
        if (!project) throw new Error(`Project ${projectId} not found`);

        const risk = await projectRiskService.calculateRisk(project);
        result = {
          projectId: project.id,
          projectName: project.name,
          status: project.status,
          actualProgress: project.progress,
          expectedProgress: risk.metrics.expectedProgress,
          progressGap: risk.metrics.progressGap,
          elapsedPercentage: risk.metrics.elapsedPercentage,
          startDate: project.startDate,
          expectedCompletion: project.expectedCompletion || project.endDate,
          assessment: risk.reasons.find(r => r.includes('schedule') || r.includes('progress')) || "Progress is within acceptable timeline bounds."
        };
        break;
      }

      case 'get_project_budget': {
        const { projectId } = args;
        const list = await postgresService.getProjects();
        const project = list.find(p => p.id.toLowerCase() === projectId.toLowerCase() || p.name.toLowerCase().includes(projectId.toLowerCase()));
        if (!project) throw new Error(`Project ${projectId} not found`);

        const risk = await projectRiskService.calculateRisk(project);
        result = {
          projectId: project.id,
          projectName: project.name,
          budget: project.budget,
          spent: project.spent,
          budgetUtilization: risk.metrics.budgetUtilization,
          actualProgress: project.progress,
          financialVariance: risk.metrics.budgetUtilization - project.progress,
          assessment: risk.reasons.find(r => r.includes('Budget')) || "Budget utilization aligns with physical progress."
        };
        break;
      }

      case 'get_project_complaints': {
        const { projectId } = args;
        const list = await postgresService.getProjects();
        const project = list.find(p => p.id.toLowerCase() === projectId.toLowerCase() || p.name.toLowerCase().includes(projectId.toLowerCase()));
        if (!project) throw new Error(`Project ${projectId} not found`);

        const nearby = await postgresService.getNearbyComplaints(project);
        result = {
          projectId: project.id,
          projectName: project.name,
          nearbyComplaintsCount: nearby.length,
          unresolvedCount: nearby.filter(c => (c.status || '').toUpperCase() !== 'RESOLVED').length,
          complaints: nearby.map(c => ({
            id: c.id,
            title: c.title,
            category: c.category,
            status: c.status,
            priority: c.priority,
            ward: c.ward
          }))
        };
        break;
      }

      case 'analyze_project_risk': {
        const { projectId } = args;
        const list = await postgresService.getProjects();
        const project = list.find(p => p.id.toLowerCase() === projectId.toLowerCase() || p.name.toLowerCase().includes(projectId.toLowerCase()));
        if (!project) throw new Error(`Project ${projectId} not found`);

        const risk = await projectRiskService.calculateRisk(project);
        result = {
          projectId: project.id,
          projectName: project.name,
          ward: project.ward,
          category: project.category,
          status: project.status,
          risk: risk.risk,
          score: risk.score,
          reasons: risk.reasons,
          metrics: risk.metrics,
          recommendations: risk.recommendations
        };
        break;
      }

      case 'get_projects_at_risk': {
        const { wardId, riskLevel } = args;
        const list = await postgresService.getProjects();
        let filtered = list;

        if (wardId) {
          filtered = filtered.filter(p => p.ward && p.ward.toLowerCase().includes(wardId.toLowerCase()));
        }

        const analyzed = await Promise.all(
          filtered.map(async (p) => {
            const risk = await projectRiskService.calculateRisk(p);
            return {
              id: p.id,
              name: p.name,
              category: p.category,
              ward: p.ward,
              department: p.department,
              progress: p.progress,
              status: p.status,
              budget: p.budget,
              spent: p.spent,
              startDate: p.startDate,
              expectedCompletion: p.expectedCompletion || p.endDate,
              coordinates: p.coordinates || (p.geometry?.type === 'Point' ? [p.geometry.coordinates[1], p.geometry.coordinates[0]] : null),
              risk: risk.risk,
              score: risk.score,
              reasons: risk.reasons,
              metrics: risk.metrics
            };
          })
        );

        let finalResult = analyzed;
        if (riskLevel) {
          finalResult = analyzed.filter(p => p.risk.toLowerCase() === riskLevel.toLowerCase());
        }

        // Sort descending by risk score
        finalResult.sort((a, b) => b.score - a.score);
        result = finalResult;
        break;
      }

      case 'get_land_use': {
        const { wardId } = args;
        const landUse = await postgresService.getLandUse();
        result = landUse.features
          .filter(f => f.properties.ward && f.properties.ward.toLowerCase().includes(wardId.toLowerCase()))
          .map(f => ({
            id: f.properties.id,
            landUse: f.properties.category,
            area: f.properties.areaAcres,
            ward: f.properties.ward,
            geometry: f.geometry
          }));
        break;
      }

      case 'get_nearby_hospitals': {
        const { latitude, longitude, radiusMeters = 5000 } = args;
        const features = await postgresService.getNearbyOSMFeatures(latitude, longitude, radiusMeters, 'hospital');
        result = features.map(f => ({
          name: f.name,
          coordinates: [f.lat, f.lng],
          distance: Math.round(f.distance),
          address: f.address || 'Kopargaon Center'
        }));
        break;
      }

      case 'get_nearby_schools': {
        const { latitude, longitude, radiusMeters = 5000 } = args;
        const features = await postgresService.getNearbyOSMFeatures(latitude, longitude, radiusMeters, 'school');
        result = features.map(f => ({
          name: f.name,
          coordinates: [f.lat, f.lng],
          distance: Math.round(f.distance),
          address: f.address || 'College Road, Kopargaon'
        }));
        break;
      }

      case 'get_road_accessibility': {
        const { latitude, longitude } = args;
        const roads = await postgresService.getNearbyRoads(latitude, longitude);
        if (roads.length > 0) {
          const nearest = roads[0];
          result = {
            nearestRoad: nearest.name,
            distance: Math.round(nearest.distance),
            nearbyRoadCount: roads.filter(r => r.distance <= 1000).length,
            connectivityInfo: `Road lanes count: ${nearest.lanes || 2}. Infrastructure status: ${nearest.status || 'Good'}.`
          };
        } else {
          result = {
            nearestRoad: 'Local Road',
            distance: 100,
            nearbyRoadCount: 1,
            connectivityInfo: 'Standard connectivity.'
          };
        }
        break;
      }

      case 'analyze_infrastructure_gap': {
        const { wardId } = args;
        const wards = await postgresService.getWards();
        const ward = wards.features.find(f => f.properties.id.toLowerCase() === wardId.toLowerCase());
        if (!ward) throw new Error(`Ward ${wardId} not found`);

        const allProj = await postgresService.getProjects();
        const projectsInWard = allProj.filter(p => p.ward && p.ward.toLowerCase().includes(ward.properties.id.toLowerCase()));

        let schoolCount = 0;
        let hospitalCount = 0;
        try {
          const filePath = path.resolve(process.cwd(), '../client/src/data/gis/infrastructure.geojson');
          const infraData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          schoolCount = infraData.features.filter(f => f.properties.type === 'school' && f.properties.ward.toLowerCase().includes(ward.properties.id.toLowerCase())).length;
          hospitalCount = infraData.features.filter(f => f.properties.type === 'hospital' && f.properties.ward.toLowerCase().includes(ward.properties.id.toLowerCase())).length;
        } catch {}

        const complaints = ward.properties.complaintsCount || 0;
        const gaps = [];

        // Healthcare Gap
        if (hospitalCount === 0) {
          gaps.push({
            category: 'Healthcare',
            severity: 'HIGH',
            evidence: ['Zero primary care or hospital facilities registered in ward boundaries.']
          });
        } else if (hospitalCount === 1) {
          gaps.push({
            category: 'Healthcare',
            severity: 'MEDIUM',
            evidence: ['Only one civic outpatient care unit serves the entire ward population.']
          });
        } else {
          gaps.push({
            category: 'Healthcare',
            severity: 'LOW',
            evidence: ['Adequate medical centers available within local limits.']
          });
        }

        // Education Gap
        if (schoolCount === 0) {
          gaps.push({
            category: 'Education',
            severity: 'HIGH',
            evidence: ['No local primary or secondary education facilities are present in this sector.']
          });
        } else {
          gaps.push({
            category: 'Education',
            severity: 'LOW',
            evidence: ['Local educational institutions exist.']
          });
        }

        // Complaints & Utilities Gap
        if (complaints > 8) {
          gaps.push({
            category: 'Utilities & Waste',
            severity: 'HIGH',
            evidence: [`High level of active municipal grievances (${complaints} cases registered).`]
          });
        } else if (complaints > 3) {
          gaps.push({
            category: 'Utilities & Waste',
            severity: 'MEDIUM',
            evidence: [`Moderate solid waste/sewerage issues (${complaints} cases registered).`]
          });
        }

        result = {
          ward: ward.properties.name,
          gaps
        };
        break;
      }

      case 'find_suitable_locations': {
        const { facilityType, wardId } = args;
        result = await spatialAnalysisService.findSuitableLocations(facilityType, wardId);
        break;
      }

      case 'get_complaints': {
        const { wardId, status, category } = args;
        result = await postgresService.getComplaints(wardId, status, category);
        break;
      }

      case 'get_nearby_complaints': {
        const { latitude, longitude, radiusMeters = 1000 } = args;
        const complaints = await postgresService.getComplaints();
        result = complaints.filter(c => {
          if (c.coordinates) {
            const dist = spatialAnalysisService.haversineDistanceMeters([longitude, latitude], [c.coordinates[1], c.coordinates[0]]);
            return dist <= radiusMeters;
          }
          return false;
        });
        break;
      }

      case 'analyze_complaint_priority': {
        const { complaintId, wardId } = args;
        const list = await postgresService.getComplaints(wardId);
        if (complaintId) {
          const found = list.find(c => c.id.toLowerCase() === complaintId.toLowerCase());
          if (!found) throw new Error(`Complaint ${complaintId} not found`);
          result = {
            id: found.id,
            title: found.title,
            priority: found.priority,
            aiScore: found.aiScore,
            aiReasons: found.aiReasons || ['High traffic area', 'Hazard reported'],
            ward: found.ward
          };
        } else {
          result = list.sort((a, b) => (b.aiScore || 50) - (a.aiScore || 50));
        }
        break;
      }

      default:
        throw new Error(`Tool ${name} not found`);
    }

    return result;
}

// Parameterized REST Tool Calling Handler
app.post('/call', async (req, res) => {
  const { name, arguments: args = {} } = req.body;
  if (!name || name === 'undefined') {
    console.warn('⚠️ MCP Server received call with missing or undefined tool name');
    return res.status(400).json({ error: 'Tool name is required', result: null });
  }
  console.log(`🤖 MCP Server REST tool called: ${name} with args:`, args);

  try {
    const result = await executeTool(name, args);
    res.json({ result });
  } catch (error) {
    console.error(`Error in REST tool execution (${name}):`, error);
    res.status(400).json({ error: error.message, result: null });
  }
});

// Standard Model Context Protocol (MCP) Server Factory
function createMcpServer() {
  const server = new Server(
    {
      name: "kopargaon-mcp-server",
      version: "1.0.0"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // MCP Tool Discovery Handler (tools/list)
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: MCP_TOOLS_REGISTRY
    };
  });

  // MCP Tool Execution Handler (tools/call)
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    console.log(`🤖 MCP SDK tool called: ${name} with args:`, args);
    try {
      const result = await executeTool(name, args);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error) {
      console.error(`Error in MCP SDK tool execution (${name}):`, error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Error executing tool ${name}: ${error.message}`
          }
        ]
      };
    }
  });

  return server;
}

const sseTransports = new Map();

// SSE handshake endpoint for n8n / MCP clients
app.get('/sse', async (req, res) => {
  console.log('🔗 Incoming MCP SSE connection');
  req.socket?.setNoDelay(true);

  // Send SSE headers and initial comment padding to immediately flush Cloudflare / reverse proxy buffers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write(': ' + 'X'.repeat(16384) + '\n\n');

  // Prevent SSEServerTransport.start() from calling writeHead again on an already open stream
  res.writeHead = function() { return res; };

  const transport = new SSEServerTransport('/messages', res);
  const server = createMcpServer();
  sseTransports.set(transport.sessionId, { transport, server });

  transport.onclose = () => {
    console.log(`🔌 MCP SSE connection closed: ${transport.sessionId}`);
    sseTransports.delete(transport.sessionId);
  };

  await server.connect(transport);
});

// SSE messages endpoint
const handleIncomingSseMessage = async (req, res) => {
  const sessionId = req.query.sessionId;
  const session = sseTransports.get(sessionId);
  if (!session) {
    res.status(404).send('Session not found');
    return;
  }
  await session.transport.handlePostMessage(req, res, req.body);
};

app.post('/messages', handleIncomingSseMessage);
app.post('/message', handleIncomingSseMessage);

const PORT = process.env.MCP_PORT || 7000;
app.listen(PORT, () => {
  console.log(`[MCP] Kopargaon Smart City MCP Server`);
  console.log(`[MCP] Port: ${PORT}`);
  console.log(`[MCP] Status: RUNNING`);
  console.log(`[MCP] Health: http://localhost:${PORT}/health`);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception caught in MCP server process:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection caught in MCP server process:', reason);
});

