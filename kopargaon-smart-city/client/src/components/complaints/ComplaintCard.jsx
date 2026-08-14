import React from 'react';
import { MapPin, ThumbsUp, Calendar, Eye, Trash2, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../common/Badge';

const PRIORITY_STYLE = {
  CRITICAL: 'text-rose-600 bg-rose-500/10 border-rose-400/30',
  HIGH:     'text-orange-600 bg-orange-500/10 border-orange-400/30',
  MEDIUM:   'text-amber-600 bg-amber-500/10 border-amber-400/30',
  LOW:      'text-emerald-600 bg-emerald-500/10 border-emerald-400/30',
  High:     'text-orange-600 bg-orange-500/10 border-orange-400/30',
  Medium:   'text-amber-600 bg-amber-500/10 border-amber-400/30',
  Low:      'text-emerald-600 bg-emerald-500/10 border-emerald-400/30'
};

const ComplaintCard = ({ complaint, onViewDetails, onLocateOnMap, onUpvote, onDelete }) => {
  const navigate = useNavigate();
  const priorityStyle = PRIORITY_STYLE[complaint.priority] || PRIORITY_STYLE.MEDIUM;
  const aiScore = complaint.aiScore;

  const handleLocate = (e) => {
    e.stopPropagation();
    if (complaint.coordinates && complaint.coordinates.length === 2) {
      const [lat, lng] = complaint.coordinates;
      navigate(`/gis?lat=${lat}&lng=${lng}`);
    } else if (onLocateOnMap) {
      onLocateOnMap(complaint);
    }
  };

  return (
    <div
      onClick={() => onViewDetails(complaint)}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {complaint.category}
          </span>
          <StatusBadge status={complaint.status} />
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2 mt-1">
          {complaint.title}
        </h3>

        {/* Location */}
        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 mt-2">
          <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
          <span className="truncate">{complaint.location} {complaint.ward ? `(${complaint.ward})` : ''}</span>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-2">
          {complaint.description}
        </p>

        {/* AI Priority Row */}
        {complaint.priority && (
          <div className="mt-2 flex items-center gap-2">
            <Cpu className="w-3 h-3 text-violet-500 shrink-0" />
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityStyle}`}>
              {complaint.priority}
            </span>
            {aiScore !== undefined && aiScore !== null && (
              <div className="flex-1 flex items-center gap-1.5">
                <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${complaint.priority === 'CRITICAL' ? 'bg-rose-500' : complaint.priority === 'HIGH' || complaint.priority === 'High' ? 'bg-orange-500' : complaint.priority === 'MEDIUM' || complaint.priority === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${aiScore}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{aiScore}/100</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs" onClick={e => e.stopPropagation()}>
        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
          <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {complaint.reportedDate}</span>
          <button
            onClick={e => { e.stopPropagation(); onUpvote && onUpvote(complaint.id); }}
            className="flex items-center text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-500/10 px-1.5 py-0.5 rounded transition-colors"
            title="Upvote Civic Grievance"
          >
            <ThumbsUp className="w-3 h-3 mr-1" /> {complaint.upvotes || 0}
          </button>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleLocate}
            className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
            title="View on GIS Map"
          >
            <MapPin className="w-4 h-4" />
          </button>

          {onDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete(complaint.id); }}
              className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
              title="Delete Grievance Ticket"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onViewDetails(complaint)}
            className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-md hover:bg-amber-500/20 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            View
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComplaintCard;
