import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Activity, AlertCircle, Building, Shield, ChevronRight } from 'lucide-react';
import { StatusBadge } from '../common/Badge';

const MapPopup = ({ data, type }) => {
  if (!data) return null;

  if (type === 'ward') {
    const p = data.properties || data;
    return (
      <div className="p-1 space-y-2 min-w-[230px]">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">{p.id}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">{p.type || 'Municipal Ward'}</span>
        </div>

        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">{p.name}</h4>

        <div className="grid grid-cols-2 gap-1.5 text-xs py-1">
          <div className="bg-slate-100 dark:bg-slate-800/80 p-2 rounded-lg">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Population</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">{p.population?.toLocaleString() || '12,500'}</span>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800/80 p-2 rounded-lg">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Development</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{p.completionRate || 75}%</span>
          </div>
        </div>

        <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
          <p><span className="text-slate-500 dark:text-slate-400">Councillor:</span> {p.councillor || 'Shri Municipal Representative'}</p>
          <p><span className="text-slate-500 dark:text-slate-400">Active Infra Projects:</span> <span className="font-bold text-blue-600 dark:text-blue-400">{p.activeProjects || 4}</span></p>
          <p><span className="text-slate-500 dark:text-slate-400">Pending Complaints:</span> <span className="font-bold text-amber-600 dark:text-amber-400">{p.complaintsCount || 6}</span></p>
        </div>

        <Link
          to={`/projects?ward=${encodeURIComponent(p.id)}`}
          className="mt-2 block w-full py-1 text-center bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold transition-colors shadow-xs"
        >
          View Ward Projects →
        </Link>
      </div>
    );
  }

  if (type === 'project') {
    const budgetNum = typeof data.budget === 'number' ? data.budget : parseFloat(data.budget || 0);
    const spentNum = typeof data.spent === 'number' ? data.spent : parseFloat(data.spent || 0);
    const utilization = budgetNum > 0 ? Math.round((spentNum / budgetNum) * 100) : 0;
    const aiRisk = data.aiRisk || data.riskAnalysis?.risk || 'UNKNOWN';
    const riskScore = data.riskScore ?? data.riskAnalysis?.score;

    return (
      <div className="p-1 space-y-2 min-w-[250px]">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5 gap-1">
          <span className="text-[10px] font-bold font-mono text-blue-600 dark:text-blue-400">{data.id}</span>
          <div className="flex items-center space-x-1">
            <StatusBadge status={data.status} />
            <RiskBadge risk={aiRisk} score={riskScore} />
          </div>
        </div>

        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{data.name}</h4>

        <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-0.5">
          <p><span className="text-slate-500 dark:text-slate-400">Department:</span> {data.department}</p>
          <p><span className="text-slate-500 dark:text-slate-400">Ward:</span> {data.ward}</p>
          <p><span className="text-slate-500 dark:text-slate-400">Budget Spent:</span> ₹{(spentNum / 100000).toFixed(0)} L of ₹{(budgetNum / 100000).toFixed(0)} L ({utilization}%)</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">Physical Progress</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{data.progress}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${
                (aiRisk === 'HIGH' || aiRisk === 'CRITICAL') ? 'bg-rose-500' : 'bg-blue-500'
              }`}
              style={{ width: `${data.progress}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-1.5 pt-2">
          <Link
            to={`/projects/${data.id}`}
            className="py-1 px-2 text-center bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition-colors shadow-xs"
          >
            View Project
          </Link>
          <Link
            to={`/projects/${data.id}?tab=risk`}
            className="py-1 px-2 text-center bg-purple-600 hover:bg-purple-500 text-white rounded text-[10px] font-bold transition-colors shadow-xs"
          >
            Analyze Risk
          </Link>
        </div>
      </div>
    );
  }

  if (type === 'landUse' || type === 'land') {
    const p = data.properties || data;
    return (
      <div className="p-1 space-y-2 min-w-[230px]">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{p.id}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">{p.category}</span>
        </div>

        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{p.name}</h4>

        <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
          <p><span className="text-slate-500 dark:text-slate-400">Area:</span> {p.areaAcres} Acres</p>
          <p><span className="text-slate-500 dark:text-slate-400">Current Usage:</span> {p.currentUsage}</p>
          <p><span className="text-slate-500 dark:text-slate-400">Recommended Usage:</span> <span className="font-semibold text-blue-600 dark:text-blue-400">{p.recommendedUsage}</span></p>
        </div>
      </div>
    );
  }

  if (type === 'complaint') {
    return (
      <div className="p-1 space-y-2 min-w-[220px]">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
          <span className="text-[10px] font-bold font-mono text-amber-600 dark:text-amber-400">{data.id}</span>
          <StatusBadge status={data.status} />
        </div>

        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{data.title}</h4>

        <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
          <p><span className="text-slate-500 dark:text-slate-400">Category:</span> {data.category}</p>
          <p><span className="text-slate-500 dark:text-slate-400">Location:</span> {data.location}</p>
        </div>

        <Link
          to="/complaints"
          className="mt-2.5 block w-full py-1 text-center bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-bold transition-colors shadow-xs"
        >
          Open Complaints Portal →
        </Link>
      </div>
    );
  }

  return (
    <div className="p-1 min-w-[190px]">
      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{data.name || data.title || 'GIS Asset'}</h4>
      <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1">{data.type || data.category || 'Municipal Spatial Marker'}</p>
      {data.ward && <p className="text-[10px] text-slate-400 mt-0.5">{data.ward}</p>}
    </div>
  );
};

export default MapPopup;
