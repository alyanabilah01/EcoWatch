
import React, { useEffect, useState } from 'react';
import { Project, Observation } from '../types';
import { db } from '../services/db';

interface FindingsHistoryProps {
  project: Project;
  onClose: () => void;
}

const FindingsHistory: React.FC<FindingsHistoryProps> = ({ project, onClose }) => {
  const [findings, setFindings] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFindings = async () => {
      const results = await db.observations
        .where('projectId')
        .equals(project.id)
        .reverse()
        .sortBy('timestamp');
      setFindings(results);
      setLoading(false);
    };
    fetchFindings();
  }, [project.id]);

  return (
    <div className="fixed inset-0 bg-[#FDFEFF] z-[70] overflow-y-auto pb-32 animate-in slide-in-from-right duration-300">
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 p-5 flex items-center justify-between z-10">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400">✕</button>
        <div className="flex-1 text-center">
          <h2 className="font-black text-slate-900 tracking-tight">Saved Findings</h2>
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{project.title}</p>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="p-6 max-w-xl mx-auto space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Searching Archives...</p>
          </div>
        ) : findings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="text-6xl mb-2 opacity-20">📂</div>
            <p className="text-slate-900 font-black uppercase tracking-tight">No Findings Yet</p>
            <p className="text-slate-400 text-sm max-w-[200px]">Start your first mission to see your logs here!</p>
          </div>
        ) : (
          findings.map((obs) => (
            <div key={obs.id} className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <div className="aspect-video relative overflow-hidden bg-slate-50">
                {obs.imageUrl ? (
                  <img src={obs.imageUrl} className="w-full h-full object-cover" alt="Observation" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl grayscale opacity-20">{project.icon}</div>
                )}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className="bg-black/50 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest w-fit">
                    {new Date(obs.timestamp).toLocaleDateString()}
                  </span>
                  {obs.location && (
                    <span className="bg-emerald-600/80 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest w-fit">
                      {obs.location.lat.toFixed(3)}, {obs.location.lng.toFixed(3)}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-sm">{project.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {obs.location?.address || "Confirmed Record"}
                    </p>
                    <p className="text-sm font-black text-slate-800 truncate">
                      {obs.location?.address ? "Verified Location" : "Scientific ID"}
                    </p>
                  </div>
                </div>
                {obs.analysis && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-[13px] text-slate-600 leading-relaxed italic line-clamp-3">
                      {obs.analysis}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FindingsHistory;
