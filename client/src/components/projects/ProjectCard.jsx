import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Compass, Edit, Trash2, Activity, ArrowRight } from 'lucide-react';
import { StatusBadge, DepartmentBadge, RiskBadge } from '../common/Badge';

const formatMoney = (amount) => {
  const num = Number(amount || 0);
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(0)} Lakh`;
  }
  return `₹${num.toLocaleString()}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'TBD';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

const ProjectCard = ({ project, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const budgetFormatted = formatMoney(project.budget);
  const spentFormatted = formatMoney(project.spent);
  const completionFormatted = formatDate(project.expectedCompletion || project.endDate);
  
  const mapUrl = project.coordinates
    ? `/gis?lat=${project.coordinates[0]}&lng=${project.coordinates[1]}&project=${project.id}`
    : `/gis?project=${project.id}`;

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer"
    >
      <div>
        {/* Top Header: Department & Status & AI Risk */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <DepartmentBadge department={project.department} />
          <div className="flex items-center space-x-1.5">
            <StatusBadge status={project.status} />
            <RiskBadge risk={project.aiRisk || project.riskAnalysis?.risk} score={project.riskScore ?? project.riskAnalysis?.score} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
          {project.name}
        </h3>

        {/* Category & Ward */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
            {project.category || 'Infrastructure'}
          </span>
          <div className="flex items-center truncate">
            <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
            <span className="truncate">{project.ward}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Progress</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{project.progress || 0}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                (project.aiRisk === 'HIGH' || project.aiRisk === 'CRITICAL')
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-500'
              }`}
              style={{ width: `${Math.min(100, project.progress || 0)}%` }}
            />
          </div>
        </div>

        {/* Budget Details & Expected Completion */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Budget</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{budgetFormatted}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Spent</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{spentFormatted}</span>
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Completion</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{completionFormatted}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
          <Link
            to={mapUrl}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-bold transition-colors flex items-center"
          >
            <Compass className="w-3.5 h-3.5 mr-1" />
            View on Map
          </Link>

          <button
            onClick={() => navigate(`/projects/${project.id}`)}
            className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-[11px] font-bold transition-colors flex items-center"
          >
            <Activity className="w-3.5 h-3.5 mr-1" />
            View Analysis
          </button>
        </div>

        <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
          {onEdit && (
            <button
              onClick={() => onEdit(project)}
              className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-500/10 transition-colors"
              title="Admin Edit"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(project.id)}
              className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
