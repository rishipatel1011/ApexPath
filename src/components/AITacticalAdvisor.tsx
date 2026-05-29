import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, Zap, Terminal, Activity, Loader2, ChevronRight } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface AITacticalAdvisorProps {
  gridData: any;
  algorithm: string;
  telemetry: any;
}

export default function AITacticalAdvisor({ gridData, algorithm, telemetry }: AITacticalAdvisorProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = "gemini-3-flash-preview";
      
      const prompt = `
        You are a Professional Racing Strategy AI. 
        Analyze the following race session parameters:
        - Optimization Algorithm: ${algorithm}
        - Track Sectors Analyzed: ${telemetry.nodesExplored}
        - Racing Line Length: ${telemetry.trajectoryLength}
        - Simulation Latency: ${telemetry.computeLatency}ms
        
        Provide a concise, high-performance strategic assessment (max 3 sentences). 
        Focus on racing line optimization, tire management, and overtaking opportunities.
        Use professional motorsport and racing telemetry terminology.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      setAnalysis(response.text || "Analysis unavailable. Proceed with caution.");
    } catch (error) {
      console.error("AI Analysis Error:", error);
      setAnalysis("Strategic link severed. Rely on manual protocols.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="glass-panel p-8 h-full flex flex-col overflow-hidden group">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-red/10 rounded-xl text-brand-red">
            <Cpu size={20} />
          </div>
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white">ApexAI Strategist</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Online</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6 no-scrollbar relative">
        <AnimatePresence mode="wait">
          {!analysis && !isAnalyzing ? (
            <motion.div 
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-40"
            >
              <Terminal className="text-slate-700" size={48} />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Awaiting Telemetry for Strategic Analysis</p>
            </motion.div>
          ) : isAnalyzing ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full space-y-6"
            >
              <div className="w-16 h-1 bg-slate-900 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-brand-red"
                  animate={{ x: [-64, 64] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                />
              </div>
              <p className="text-[10px] text-brand-red font-black uppercase tracking-[0.3em] animate-pulse">Simulating Racing Lines</p>
            </motion.div>
          ) : (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl relative overflow-hidden group/card">
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-red" />
                <p className="text-sm text-slate-200 leading-relaxed font-medium italic">
                  "{analysis}"
                </p>
              </div>
              <div className="flex items-center gap-3 px-2">
                <Activity size={12} className="text-brand-red" />
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">Strategy Verified by ApexAI v4.0</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 pt-8 border-t border-white/5">
        <button
          onClick={generateAnalysis}
          disabled={isAnalyzing}
          className="w-full btn-primary py-5 flex items-center justify-center gap-4 relative overflow-hidden group"
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm font-black">PROCESSING...</span>
            </>
          ) : (
            <>
              <Zap size={20} fill="currentColor" />
              <span className="text-sm font-black">GENERATE STRATEGY</span>
            </>
          )}
          <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </button>
      </div>
    </div>
  );
}
