import React from 'react';
import { MapPin, Eye, ThumbsUp, Trash2 } from 'lucide-react';
import { StatusBadge } from '../common/Badge';

const ComplaintTable = ({ complaints, onViewDetails, onLocateOnMap, onUpvote, onDelete }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="px-4 py-3.5">Ticket ID & Title</th>
            <th className="px-4 py-3.5">Category</th>
            <th className="px-4 py-3.5">Location / Ward</th>
            <th className="px-4 py-3.5">Priority</th>
            <th className="px-4 py-3.5">Reported</th>
            <th className="px-4 py-3.5">Upvotes</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
          {complaints.map((c) => (
            <tr
              key={c.id}
              onClick={() => onViewDetails(c)}
              className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
            >
              <td className="px-4 py-3.5 max-w-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors block">{c.title}</span>
                <span className="text-[10px] text-amber-500 font-semibold">{c.id}</span>
              </td>
              <td className="px-4 py-3.5">
                <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  {c.category}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <div className="font-medium">{c.location}</div>
                <div className="text-[10px] text-slate-400">{c.ward}</div>
              </td>
              <td className="px-4 py-3.5">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.priority === 'Critical' || c.priority === 'High'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {c.priority}
                </span>
              </td>
              <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">{c.reportedDate}</td>
              <td className="px-4 py-3.5 font-bold text-blue-600 dark:text-blue-400" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => onUpvote && onUpvote(c.id)}
                  className="flex items-center hover:bg-blue-500/10 px-2 py-1 rounded transition-colors"
                >
                  <ThumbsUp className="w-3 h-3 mr-1" /> {c.upvotes || 0}
                </button>
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={c.status} />
              </td>
              <td className="px-4 py-3.5 text-right space-x-1.5" onClick={e => e.stopPropagation()}>
                {onLocateOnMap && (
                  <button
                    onClick={() => onLocateOnMap(c)}
                    className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-500/10 transition-colors"
                    title="Locate on Map"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(c.id)}
                    className="p-1.5 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                    title="Delete Grievance Ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onViewDetails(c)}
                  className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-semibold"
                >
                  Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ComplaintTable;
