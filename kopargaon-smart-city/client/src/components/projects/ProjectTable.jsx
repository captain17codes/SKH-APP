import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Edit, Trash2, Activity, Compass } from 'lucide-react';
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

const ProjectTable = ({ projects, onEdit, onDelete }) => {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="px-4 py-3.5">Project & Ward</th>
            <th className="px-4 py-3.5">Category</th>
            <th className="px-4 py-3.5">Department</th>
            <th className="px-4 py-3.5">Progress</th>
            <th className="px-4 py-3.5 text-right">Budget / Spent</th>
            <th className="px-4 py-3.5">Completion Date</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5">AI Risk</th>
            <th className="px-4 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
          {projects.map((p) => {
            const mapUrl = p.coordinates
              ? `/gis?lat=${p.coordinates[0]}&lng=${p.coordinates[1]}&project=${p.id}`
              : `/gis?project=${p.id}`;

            const budgetFormatted = formatMoney(p.budget);
            const spentFormatted = formatMoney(p.spent);
            const completionFormatted = formatDate(p.expectedCompletion || p.endDate);

            return (
              <tr
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
              >
                <td className="px-4 py-3.5 max-w-xs">
                  <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal block">{p.id} · {p.ward}</span>
                </td>
                <td className="px-4 py-3.5 font-medium">{p.category || 'Infra'}</td>
                <td className="px-4 py-3.5">
                  <DepartmentBadge department={p.department} />
                </td>
                <td className="px-4 py-3.5 w-32">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${
                          (p.aiRisk === 'HIGH' || p.aiRisk === 'CRITICAL') ? 'bg-rose-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(100, p.progress || 0)}%` }}
                      />
                    </div>
                    <span className="font-bold text-[11px] text-blue-600 dark:text-blue-400">{p.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right font-medium">
                  <span className="font-bold text-slate-900 dark:text-slate-100 block">{budgetFormatted}</span>
                  <span className="text-[10px] text-slate-400">Spent: {spentFormatted}</span>
                </td>
                <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium">{completionFormatted}</td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3.5">
                  <RiskBadge risk={p.aiRisk || p.riskAnalysis?.risk} score={p.riskScore ?? p.riskAnalysis?.score} />
                </td>
                <td className="px-4 py-3.5 text-right space-x-1" onClick={e => e.stopPropagation()}>
                  <Link
                    to={mapUrl}
                    className="p-1.5 inline-flex items-center rounded text-emerald-600 hover:bg-emerald-500/10 transition-colors font-bold text-[11px]"
                    title="View on Map"
                  >
                    <Compass className="w-3.5 h-3.5 mr-0.5" />
                    Map
                  </Link>

                  <button
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="p-1.5 inline-flex items-center rounded text-blue-600 hover:bg-blue-500/10 transition-colors font-bold text-[11px]"
                    title="View Analysis"
                  >
                    <Activity className="w-3.5 h-3.5 mr-0.5" />
                    Analyze
                  </button>

                  {onEdit && (
                    <button
                      onClick={() => onEdit(p)}
                      className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-500/10 transition-colors"
                      title="Edit Project"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {onDelete && (
                    <button
                      onClick={() => onDelete(p.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectTable;
