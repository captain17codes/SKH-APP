import React, { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, Calendar, Sparkles } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import ChartCard from '../components/common/ChartCard';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { MOCK_PROJECTS, MOCK_COMPLAINTS } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const DATE_RANGE_OPTIONS = ['7 Days', '30 Days', '6 Months', '1 Year'];

const AnalyticsPage = () => {
  const { theme } = useTheme();
  const [selectedRange, setSelectedRange] = useState('30 Days');

  const tooltipStyle = theme === 'dark'
    ? { backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }
    : { backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '0.5rem', color: '#0f172a', fontSize: '12px' };

  // Chart datasets
  const complaintTrendsData = [
    { period: 'Week 1', road: 14, water: 8, garbage: 12, streetLight: 6 },
    { period: 'Week 2', road: 18, water: 12, garbage: 9, streetLight: 10 },
    { period: 'Week 3', road: 11, water: 15, garbage: 14, streetLight: 8 },
    { period: 'Week 4', road: 8, water: 6, garbage: 7, streetLight: 4 }
  ];

  const landUsePieData = [
    { name: 'Residential', value: 42, color: '#3b82f6' },
    { name: 'Commercial', value: 18, color: '#f59e0b' },
    { name: 'Industrial', value: 14, color: '#ec4899' },
    { name: 'Agriculture', value: 16, color: '#84cc16' },
    { name: 'Green Reserve', value: 10, color: '#10b981' }
  ];

  const populationGrowthData = [
    { year: '2020', pop: 68000 },
    { year: '2022', pop: 72400 },
    { year: '2024', pop: 77800 },
    { year: '2026', pop: 83500 },
    { year: '2028 (Proj)', pop: 89800 },
    { year: '2030 (Proj)', pop: 96500 }
  ];

  const infraDistributionData = [
    { category: 'Water Pipe (km)', count: 42 },
    { category: 'Road Network (km)', count: 68 },
    { category: 'Drainage (km)', count: 35 },
    { category: 'Solar (MW)', count: 5.5 },
    { category: 'Health Beds', count: 275 }
  ];

  const handleExportPDF = () => {
    const columns = [
      { header: 'Project ID', key: 'id' },
      { header: 'Project Title', key: 'name' },
      { header: 'Department', key: 'department' },
      { header: 'Ward', key: 'ward' },
      { header: 'Budget (INR)', key: 'budget' },
      { header: 'Progress %', key: 'progress' },
      { header: 'Status', key: 'status' }
    ];

    exportToPDF('Kopargaon Smart City Analytics & Infrastructure Report', columns, MOCK_PROJECTS, 'Kopargaon_Smart_City_Analytics.pdf');
    toast.success('Analytics PDF report downloaded successfully!');
  };

  const handleExportExcel = () => {
    const exportData = MOCK_PROJECTS.map(p => ({
      'Project ID': p.id,
      'Title': p.name,
      'Department': p.department,
      'Ward Location': p.ward,
      'Budget (INR)': p.budget,
      'Spent (INR)': p.spent,
      'Progress %': p.progress,
      'Status': p.status,
      'End Date': p.endDate
    }));

    exportToExcel(exportData, 'Smart_City_Analytics', 'Kopargaon_Infrastructure_Analytics.xlsx');
    toast.success('Analytics Excel spreadsheet downloaded successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Range Switcher & Export Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <BarChart3 className="w-5 h-5 text-purple-500 mr-2" />
            Executive Smart City Analytics & Data Intelligence
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-dimensional performance indicators, demographic growth forecasting, land distribution, and infrastructure status.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Filter Range */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            {DATE_RANGE_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setSelectedRange(opt)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  selectedRange === opt
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Export Buttons */}
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>PDF Export</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel Export</span>
          </button>
        </div>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complaint Trends Line Chart */}
        <ChartCard
          title="Citizen Complaint Trends & Category Flow"
          subtitle={`Grievance submission distribution over past ${selectedRange}`}
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={complaintTrendsData}>
                <XAxis dataKey="period" stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} fontSize={11} />
                <YAxis stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="road" name="Road Damage" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="water" name="Water Leak" stroke="#06b6d4" strokeWidth={2} />
                <Line type="monotone" dataKey="garbage" name="Garbage" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="streetLight" name="Streetlights" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Population Growth Forecast Area Chart */}
        <ChartCard
          title="Kopargaon Population Growth & Housing Demand Forecast"
          subtitle="Demographic progression 2020 - 2030 (Master Plan Census)"
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={populationGrowthData}>
                <defs>
                  <linearGradient id="colorPop" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} fontSize={11} />
                <YAxis stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} fontSize={11} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="pop" name="Population" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPop)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Land-Use Area Distribution Pie */}
        <ChartCard
          title="Municipal Land-Use Zoning Area Distribution (%)"
          subtitle="Current zonal master layout allocations"
        >
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={landUsePieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {landUsePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Infrastructure Asset Bar Chart */}
        <ChartCard
          title="Smart Infrastructure Asset Distribution"
          subtitle="Total key municipal assets deployed"
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={infraDistributionData} layout="vertical">
                <XAxis type="number" stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} fontSize={11} />
                <YAxis dataKey="category" type="category" stroke={theme === 'dark' ? "#94a3b8" : "#64748b"} fontSize={10} width={100} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default AnalyticsPage;
