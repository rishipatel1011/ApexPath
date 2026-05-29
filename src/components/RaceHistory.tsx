import React from 'react';
import { motion } from 'motion/react';
import { History, Clock, Database, Zap, Timer, ChevronRight } from 'lucide-react';
import { RaceSession } from '../types';

interface RaceHistoryProps {
  sessions: RaceSession[];
  onSelectSession: (session: RaceSession) => void;
}

export default function RaceHistory({ sessions, onSelectSession }: RaceHistoryProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
        {sessions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30 py-20">
            <Database size={48} className="text-slate-700" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">No Telemetry Archives Found</p>
          </div>
        ) : (
          sessions.map((session, idx) => (
            <motion.button
              key={session.id || idx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ x: 5 }}
              onClick={() => onSelectSession(session)}
              className="w-full text-left p-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-red opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-brand-red uppercase tracking-[0.2em]">{session.algorithm}</span>
                  <div className="flex items-center gap-2 mt-1 text-slate-500">
                    <Clock size={10} />
                    <span className="text-[9px] font-bold uppercase">
                      {session.timestamp?.toDate().toLocaleString() || 'Live Session'}
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-white/5 rounded-xl text-slate-500 group-hover:text-white transition-colors">
                  <ChevronRight size={16} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1">Explored</span>
                  <div className="flex items-center gap-2">
                    <Timer size={12} className="text-slate-400" />
                    <span className="text-sm font-black text-white">{session.telemetry.nodesExplored}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest mb-1">Length</span>
                  <div className="flex items-center gap-2">
                    <Zap size={12} className="text-brand-red" />
                    <span className="text-sm font-black text-white">{session.telemetry.trajectoryLength}m</span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
}
