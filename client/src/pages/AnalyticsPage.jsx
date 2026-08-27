import React, { useState } from 'react';
import { exportToPDF, exportToExcel } from '../utils/exportUtils';
import { MOCK_PROJECTS } from '../data/mockData';
import toast from 'react-hot-toast';

const AnalyticsPage = () => {
  const [selectedRange, setSelectedRange] = useState('30 Days');
  const [selectedWard, setSelectedWard] = useState('All Wards');

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
    <div className="flex-1 flex flex-col min-w-0 h-full">
      {/* Page Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-display-md font-display-md text-on-surface dark:text-inverse-on-surface">Analytics Dashboard</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-1">Comprehensive view of city metrics and development progress.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-container-lowest dark:bg-surface-variant border border-outline-variant dark:border-outline rounded-lg p-1 shadow-ambient-lvl1">
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 text-label-md font-label-md text-primary dark:text-primary-fixed bg-primary-container/10 rounded hover:bg-primary-container/20 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
              Export PDF
            </button>
            <div className="w-[1px] bg-outline-variant dark:bg-outline mx-1 my-1"></div>
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 text-label-md font-label-md text-on-surface-variant dark:text-inverse-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">table_chart</span>
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest dark:bg-surface-variant rounded-xl p-4 shadow-ambient-lvl1 border border-outline-variant dark:border-outline flex flex-wrap gap-4 items-center justify-between mb-8">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-outline dark:text-outline-variant">filter_list</span>
            <span className="text-label-md font-label-md text-on-surface-variant dark:text-inverse-on-surface">Filters:</span>
          </div>
          <div className="relative">
            <select 
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="appearance-none bg-surface-bright dark:bg-surface border border-outline-variant dark:border-outline rounded-lg pl-4 pr-10 py-2 text-body-md font-body-md text-on-surface dark:text-inverse-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary cursor-pointer min-w-[150px]"
            >
              <option>All Wards</option>
              <option>Ward A - Central</option>
              <option>Ward B - North</option>
              <option>Ward C - South</option>
              <option>Ward D - East</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline dark:text-outline-variant pointer-events-none">expand_more</span>
          </div>
          <div className="flex items-center bg-surface-bright dark:bg-surface border border-outline-variant dark:border-outline rounded-lg overflow-hidden">
            <input className="border-none bg-transparent py-2 pl-4 text-body-md font-body-md text-on-surface dark:text-inverse-on-surface focus:ring-0 cursor-pointer" type="date" defaultValue="2023-01-01" />
            <span className="text-outline-variant dark:text-outline px-2">-</span>
            <input className="border-none bg-transparent py-2 pr-4 text-body-md font-body-md text-on-surface dark:text-inverse-on-surface focus:ring-0 cursor-pointer" type="date" defaultValue="2023-12-31" />
          </div>
        </div>
        <button className="bg-surface-bright dark:bg-surface border border-outline-variant dark:border-outline text-on-surface-variant dark:text-inverse-on-surface px-4 py-2 rounded-lg text-label-md font-label-md hover:bg-surface-container-low transition-colors flex items-center gap-2 cursor-pointer">
          <span className="material-symbols-outlined text-[18px]">refresh</span> Reset
        </button>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        
        {/* Projects by Status */}
        <div className="bg-surface-container-lowest dark:bg-surface-variant rounded-xl shadow-ambient-lvl1 border border-outline-variant dark:border-outline p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-title-lg font-title-lg text-on-surface dark:text-inverse-on-surface">Projects by Status</h3>
            <button className="text-outline hover:text-primary transition-colors cursor-pointer"><span className="material-symbols-outlined">more_vert</span></button>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
            <div className="w-48 h-48 rounded-full border-[24px] border-surface-bright dark:border-surface relative" style={{ background: 'conic-gradient(#00236f 0% 45%, #00687a 45% 70%, #27c38a 70% 85%, #ba1a1a 85% 100%)' }}>
              <div className="absolute inset-0 bg-surface-container-lowest dark:bg-surface-variant rounded-full m-[12px] flex items-center justify-center flex-col shadow-inner">
                <span className="text-headline-md font-headline-md text-on-surface dark:text-inverse-on-surface">142</span>
                <span className="text-label-sm font-label-sm text-outline dark:text-outline-variant">Total</span>
              </div>
            </div>
            <div className="ml-8 flex flex-col gap-3">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary"></div><span className="text-body-md font-body-md text-on-surface-variant dark:text-inverse-on-surface">Ongoing (45%)</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-secondary"></div><span className="text-body-md font-body-md text-on-surface-variant dark:text-inverse-on-surface">Completed (25%)</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-on-tertiary-container"></div><span className="text-body-md font-body-md text-on-surface-variant dark:text-inverse-on-surface">Approved (15%)</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-error"></div><span class="text-body-md font-body-md text-on-surface-variant dark:text-inverse-on-surface">Delayed (15%)</span></div>
            </div>
          </div>
        </div>

        {/* Progress % over time */}
        <div className="bg-surface-container-lowest dark:bg-surface-variant rounded-xl shadow-ambient-lvl1 border border-outline-variant dark:border-outline p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-title-lg font-title-lg text-on-surface dark:text-inverse-on-surface">Progress Over Time</h3>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-primary-container/10 text-primary dark:text-primary-fixed rounded text-label-sm font-label-sm">YTD</span>
              <span className="px-2 py-1 text-on-surface-variant hover:bg-surface-container-low rounded text-label-sm font-label-sm cursor-pointer">1Y</span>
            </div>
          </div>
          <div className="flex-1 relative w-full border-b border-l border-outline-variant dark:border-outline">
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              <line stroke="var(--color-outline-variant)" strokeDasharray="2,2" strokeWidth="0.5" x1="0" x2="100" y1="25" y2="25"></line>
              <line stroke="var(--color-outline-variant)" strokeDasharray="2,2" strokeWidth="0.5" x1="0" x2="100" y1="50" y2="50"></line>
              <line stroke="var(--color-outline-variant)" strokeDasharray="2,2" strokeWidth="0.5" x1="0" x2="100" y1="75" y2="75"></line>
              <path className="path-anim" d="M0,80 Q20,70 40,50 T70,30 T100,10" fill="none" stroke="#00236f" strokeWidth="2"></path>
              <path d="M0,80 Q20,70 40,50 T70,30 T100,10 L100,100 L0,100 Z" fill="url(#grad)" opacity="0.1"></path>
              <circle cx="0" cy="80" fill="#00236f" r="1.5"></circle>
              <circle cx="40" cy="50" fill="#00236f" r="1.5"></circle>
              <circle cx="70" cy="30" fill="#00236f" r="1.5"></circle>
              <circle cx="100" cy="10" fill="#00236f" r="1.5"></circle>
              <defs>
                <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00236f"></stop>
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute -left-6 bottom-0 text-[10px] text-outline dark:text-outline-variant">0%</div>
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-[10px] text-outline dark:text-outline-variant">50%</div>
            <div className="absolute -left-8 top-0 text-[10px] text-outline dark:text-outline-variant">100%</div>
            <div className="absolute bottom-[-20px] left-0 text-[10px] text-outline dark:text-outline-variant">Q1</div>
            <div className="absolute bottom-[-20px] left-[40%] text-[10px] text-outline dark:text-outline-variant">Q2</div>
            <div className="absolute bottom-[-20px] left-[70%] text-[10px] text-outline dark:text-outline-variant">Q3</div>
            <div className="absolute bottom-[-20px] right-0 text-[10px] text-outline dark:text-outline-variant">Q4</div>
          </div>
        </div>

        {/* Land Use Distribution */}
        <div className="bg-surface-container-lowest dark:bg-surface-variant rounded-xl shadow-ambient-lvl1 border border-outline-variant dark:border-outline p-6 flex flex-col h-[400px] lg:col-span-2 xl:col-span-1">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-title-lg font-title-lg text-on-surface dark:text-inverse-on-surface">Land Use Distribution (Hectares)</h3>
            <a className="text-label-md font-label-md text-primary dark:text-primary-fixed hover:underline" href="#">View Map</a>
          </div>
          <div className="flex-1 flex flex-col justify-end gap-6 relative">
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#4059aa] rounded-sm"></div><span className="text-label-sm text-on-surface-variant dark:text-inverse-on-surface">Residential</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#00687a] rounded-sm"></div><span className="text-label-sm text-on-surface-variant dark:text-inverse-on-surface">Commercial</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#757682] rounded-sm"></div><span className="text-label-sm text-on-surface-variant dark:text-inverse-on-surface">Industrial</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#27c38a] rounded-sm"></div><span className="text-label-sm text-on-surface-variant dark:text-inverse-on-surface">Agriculture</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-[#4edea3] rounded-sm"></div><span className="text-label-sm text-on-surface-variant dark:text-inverse-on-surface">Green Reserve</span></div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="relative h-8 w-full bg-surface-container dark:bg-surface-container-highest rounded-sm overflow-hidden flex">
                <div className="h-full bg-[#4059aa]" style={{ width: '45%' }} title="Residential 45%"></div>
                <div className="h-full bg-[#00687a]" style={{ width: '20%' }} title="Commercial 20%"></div>
                <div className="h-full bg-[#757682]" style={{ width: '15%' }} title="Industrial 15%"></div>
                <div className="h-full bg-[#27c38a]" style={{ width: '10%' }} title="Agriculture 10%"></div>
                <div className="h-full bg-[#4edea3]" style={{ width: '10%' }} title="Green Reserve 10%"></div>
              </div>
              <div className="flex justify-between text-label-sm text-outline dark:text-outline-variant">
                <span>City Total</span>
                <span>12,500 Ha</span>
              </div>
              <div className="mt-4 border-t border-outline-variant dark:border-outline pt-4">
                <p className="text-body-md font-body-md text-on-surface dark:text-inverse-on-surface">Target Zoning Shift (2030)</p>
                <div className="relative h-4 w-full bg-surface-container dark:bg-surface-container-highest rounded-sm overflow-hidden flex mt-2 opacity-70">
                  <div className="h-full bg-[#4059aa]" style={{ width: '40%' }}></div>
                  <div className="h-full bg-[#00687a]" style={{ width: '25%' }}></div>
                  <div className="h-full bg-[#757682]" style={{ width: '15%' }}></div>
                  <div className="h-full bg-[#27c38a]" style={{ width: '5%' }}></div>
                  <div className="h-full bg-[#4edea3]" style={{ width: '15%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Health Beds per Ward */}
        <div className="bg-surface-container-lowest dark:bg-surface-variant rounded-xl shadow-ambient-lvl1 border border-outline-variant dark:border-outline p-6 flex flex-col h-[400px] lg:col-span-2 xl:col-span-1">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-title-lg font-title-lg text-on-surface dark:text-inverse-on-surface">Health Beds Capacity by Ward</h3>
            <span className="text-label-sm font-label-sm text-secondary bg-secondary-container/20 px-2 py-1 rounded">Avg: 240</span>
          </div>
          <div className="flex-1 flex items-end justify-around border-b border-outline-variant dark:border-outline pb-2 relative h-full mt-4">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="border-t border-outline-variant/30 dark:border-outline/30 w-full"></div>
              <div className="border-t border-outline-variant/30 dark:border-outline/30 w-full"></div>
              <div className="border-t border-outline-variant/30 dark:border-outline/30 w-full"></div>
              <div className="border-t border-outline-variant/30 dark:border-outline/30 w-full"></div>
              <div className="w-full"></div>
            </div>
            <div className="absolute -left-6 inset-y-0 flex flex-col justify-between text-[10px] text-outline dark:text-outline-variant">
              <span>400</span>
              <span>300</span>
              <span>200</span>
              <span>100</span>
              <span>0</span>
            </div>
            
            <div className="flex flex-col items-center gap-2 z-10 group">
              <div className="w-12 bg-primary rounded-t-sm h-[60%] transition-all group-hover:bg-primary-fixed-variant relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-label-sm font-label-sm text-on-surface hidden group-hover:block bg-surface-container-lowest px-1 shadow-sm rounded">240</div>
              </div>
              <span className="text-label-sm text-on-surface-variant dark:text-inverse-on-surface">Ward A</span>
            </div>
            <div className="flex flex-col items-center gap-2 z-10 group">
              <div className="w-12 bg-primary rounded-t-sm h-[85%] transition-all group-hover:bg-primary-fixed-variant relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-label-sm font-label-sm text-on-surface hidden group-hover:block bg-surface-container-lowest px-1 shadow-sm rounded">340</div>
              </div>
              <span className="text-label-sm text-on-surface-variant dark:text-inverse-on-surface">Ward B</span>
            </div>
            <div className="flex flex-col items-center gap-2 z-10 group">
              <div className="w-12 bg-error/80 rounded-t-sm h-[30%] transition-all group-hover:bg-error relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-label-sm font-label-sm text-on-surface hidden group-hover:block bg-surface-container-lowest px-1 shadow-sm rounded">120</div>
              </div>
              <span className="text-label-sm text-error font-bold">Ward C</span>
            </div>
            <div className="flex flex-col items-center gap-2 z-10 group">
              <div className="w-12 bg-primary rounded-t-sm h-[65%] transition-all group-hover:bg-primary-fixed-variant relative">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-label-sm font-label-sm text-on-surface hidden group-hover:block bg-surface-container-lowest px-1 shadow-sm rounded">260</div>
              </div>
              <span className="text-label-sm text-on-surface-variant dark:text-inverse-on-surface">Ward D</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsPage;
