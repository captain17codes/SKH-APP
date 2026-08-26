import projectRiskService from '../services/projectRiskService.js';
import postgresService from '../services/postgresService.js';

// Fallback in-memory project store if database is offline
let fallbackProjects = [
  {
    id: "PRJ-2026-001",
    name: "Godavari Riverfront Promenade & Flood Barrier",
    category: "Green Zone & Eco-Tourism",
    department: "Urban Development & Irrigation",
    ward: "Ward 2 - Riverbank",
    budget: 45000000,
    spent: 32500000,
    progress: 72,
    startDate: "2025-04-15",
    expectedCompletion: "2026-11-30",
    status: "IN_PROGRESS",
    contractor: "Maharashtra Infrastructure Corp",
    engineer: "Er. Ramesh Kulkarni",
    description: "Construction of 2.4 km reinforced riverside embankment, solar walkways, amphitheater, and flood telemetry sensors.",
    coordinates: [19.8985, 74.4840]
  },
  {
    id: "PRJ-2026-002",
    name: "Road Development — Ward 4",
    category: "Road Construction",
    department: "Public Works Department (PWD)",
    ward: "Ward 4 - Yesgaon Bypass",
    budget: 5000000, // ₹50 Lakh
    spent: 39000000, // ₹39 Lakh
    progress: 48,
    startDate: "2025-01-10",
    expectedCompletion: "2026-09-15",
    status: "DELAYED",
    contractor: "Shree Ganesh Construction Ltd",
    engineer: "Er. Sunita Jadhav",
    description: "Multi-lane arterial road asphalt resurfacing, storm drain reconstruction, and street light ducting in Ward 4.",
    coordinates: [19.8830, 74.4880]
  },
  {
    id: "PRJ-2026-003",
    name: "Underground 24x7 Water Grid & Smart Metering",
    category: "Water Supply",
    department: "Water Supply & Sanitation",
    ward: "Ward 3 - Laxmi Nagar",
    budget: 36000000,
    spent: 18000000,
    progress: 50,
    startDate: "2025-09-01",
    expectedCompletion: "2027-03-31",
    status: "IN_PROGRESS",
    contractor: "AquaTech Water Systems",
    engineer: "Er. Mahesh Patil",
    description: "Replacing 18 km aging cement water pipes with HDPE pressurized lines equipped with ultrasonic IoT meters.",
    coordinates: [19.8875, 74.4730]
  },
  {
    id: "PRJ-2026-004",
    name: "TAKLI MIDC 5MW Rooftop & Ground Solar Park",
    category: "Renewable Energy",
    department: "Renewable Energy & Power",
    ward: "Ward 5 - MIDC Zone",
    budget: 54000000,
    spent: 54000000,
    progress: 100,
    startDate: "2024-08-01",
    expectedCompletion: "2026-02-28",
    status: "COMPLETED",
    contractor: "MahaSolar CleanGrid",
    engineer: "Er. Anand Varma",
    description: "Grid-connected 5 MegaWatt solar photovoltaic station powering public streetlights and municipal pump stations.",
    coordinates: [19.8790, 74.4610]
  },
  {
    id: "PRJ-2026-005",
    name: "Yesgaon Multi-Modal Logistics & Cold Chain Yard",
    category: "Town Planning",
    department: "Town Planning & Industry",
    ward: "Ward 4 - Yesgaon Bypass",
    budget: 95000000,
    spent: 19000000,
    progress: 20,
    startDate: "2026-01-15",
    expectedCompletion: "2027-12-20",
    status: "PLANNED",
    contractor: "Apex Infra Projects",
    engineer: "Er. Vijay Tambe",
    description: "22-acre modern logistic hub featuring 10,000 MT temperature-controlled cold storage for agricultural produce.",
    coordinates: [19.8830, 74.4880]
  },
  {
    id: "PRJ-2026-006",
    name: "Subhash Road Heritage Market Beautification",
    category: "Heritage & Infrastructure",
    department: "Town Planning & Heritage",
    ward: "Ward 6 - Samvatsar Border",
    budget: 28000000,
    spent: 24000000,
    progress: 88,
    startDate: "2025-03-01",
    expectedCompletion: "2026-09-30",
    status: "APPROVED",
    contractor: "Heritage Craft Builders",
    engineer: "Er. Sneha Borse",
    description: "Pedestrianization of central market street, underground utility cabling, unified shop facade signages.",
    coordinates: [19.8900, 74.4760]
  }
];

const fetchRawProjects = async () => {
  try {
    const isDb = await postgresService.isDatabaseAvailable();
    if (isDb) {
      const dbProjects = await postgresService.getProjects();
      if (dbProjects && dbProjects.length > 0) return dbProjects;
    }
  } catch {}
  return fallbackProjects;
};

export const projectController = {
  // Get all projects enriched with AI Risk analysis
  getAllProjects: async (req, res) => {
    try {
      const rawList = await fetchRawProjects();
      const enriched = await Promise.all(
        rawList.map(async (p) => {
          const riskAnalysis = await projectRiskService.calculateRisk(p);
          return {
            ...p,
            aiRisk: riskAnalysis.risk,
            riskScore: riskAnalysis.score,
            riskAnalysis
          };
        })
      );
      res.json(enriched);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get single project details with risk breakdown & nearby complaints
  getProjectById: async (req, res) => {
    try {
      const { id } = req.params;
      const rawList = await fetchRawProjects();
      const project = rawList.find(p => p.id.toLowerCase() === id.toLowerCase());

      if (!project) {
        return res.status(404).json({ error: `Project ${id} not found` });
      }

      const riskAnalysis = await projectRiskService.calculateRisk(project);
      res.json({
        ...project,
        aiRisk: riskAnalysis.risk,
        riskScore: riskAnalysis.score,
        riskAnalysis
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get project risk breakdown specifically
  getProjectRisk: async (req, res) => {
    try {
      const { id } = req.params;
      const rawList = await fetchRawProjects();
      const project = rawList.find(p => p.id.toLowerCase() === id.toLowerCase());

      if (!project) {
        return res.status(404).json({ error: `Project ${id} not found` });
      }

      const riskAnalysis = await projectRiskService.calculateRisk(project);
      res.json(riskAnalysis);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get AI City Overview Metrics
  getOverview: async (req, res) => {
    try {
      const rawList = await fetchRawProjects();
      const enriched = await Promise.all(
        rawList.map(p => projectRiskService.calculateRisk(p))
      );

      const totalProjects = rawList.length;
      let ongoing = 0;
      let completed = 0;
      let delayed = 0;
      let highRisk = 0;
      let criticalRisk = 0;

      rawList.forEach((p, idx) => {
        const st = (p.status || '').toUpperCase();
        if (st === 'IN_PROGRESS' || st === 'ONGOING' || st === 'APPROVED') ongoing++;
        if (st === 'COMPLETED') completed++;
        if (st === 'DELAYED') delayed++;

        const risk = enriched[idx].risk;
        if (risk === 'HIGH') highRisk++;
        if (risk === 'CRITICAL') criticalRisk++;
      });

      res.json({
        totalProjects,
        ongoing,
        completed,
        delayed,
        highRisk,
        criticalRisk
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Admin update project & trigger automatic risk recalculation
  updateProject: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const rawList = await fetchRawProjects();
      const projectIndex = rawList.findIndex(p => p.id.toLowerCase() === id.toLowerCase());

      if (projectIndex === -1) {
        return res.status(404).json({ error: `Project ${id} not found` });
      }

      // Update fields
      const updatedProject = {
        ...rawList[projectIndex],
        ...updates
      };

      if (await postgresService.isDatabaseAvailable()) {
        await postgresService.query(
          `UPDATE projects SET status = $1, progress = $2, budget = $3, spent = $4, expected_completion = $5, department = $6 WHERE id = $7`,
          [
            updatedProject.status,
            updatedProject.progress,
            updatedProject.budget,
            updatedProject.spent,
            updatedProject.expectedCompletion,
            updatedProject.department,
            id
          ]
        );
      } else {
        fallbackProjects[projectIndex] = updatedProject;
      }

      // Automatically recalculate AI risk after update
      const newRiskAnalysis = await projectRiskService.calculateRisk(updatedProject);

      res.json({
        ...updatedProject,
        aiRisk: newRiskAnalysis.risk,
        riskScore: newRiskAnalysis.score,
        riskAnalysis: newRiskAnalysis
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Create new project
  createProject: async (req, res) => {
    try {
      const newProj = {
        id: `PRJ-2026-${Math.floor(100 + Math.random() * 900)}`,
        status: 'PLANNED',
        progress: 0,
        spent: 0,
        ...req.body
      };
      fallbackProjects.unshift(newProj);

      const riskAnalysis = await projectRiskService.calculateRisk(newProj);
      res.status(201).json({
        ...newProj,
        aiRisk: riskAnalysis.risk,
        riskScore: riskAnalysis.score,
        riskAnalysis
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Delete project
  deleteProject: async (req, res) => {
    try {
      const { id } = req.params;
      fallbackProjects = fallbackProjects.filter(p => p.id.toLowerCase() !== id.toLowerCase());
      res.json({ success: true, message: `Project ${id} deleted` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

export default projectController;
