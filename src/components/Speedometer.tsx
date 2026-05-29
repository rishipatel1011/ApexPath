import React from 'react';
import { motion } from 'motion/react';

interface SpeedometerProps {
  progress: number; // 0 to 100
  isRunning: boolean;
}

export default function Speedometer({ progress, isRunning }: SpeedometerProps) {
  const rotation = (progress / 100) * 240 - 120; // -120 to 120 degrees

  return (
    <div className="relative w-64 h-64 flex items-center justify-center opacity-20 pointer-events-none">
      {/* Outer Ring */}
      <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
      
      {/* Ticks */}
      {[...Array(11)].map((_, i) => {
        const angle = i * 24 - 120;
        return (
          <div
            key={i}
            className="absolute w-1 h-3 bg-white/20"
            style={{
              transform: `rotate(${angle}deg) translateY(-110px)`,
            }}
          />
        );
      })}

      {/* Speed Text */}
      <div className="flex flex-col items-center z-10">
        <motion.span 
          className="text-6xl font-black text-white tracking-tighter"
          animate={{ scale: isRunning ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: Infinity, duration: 0.2 }}
        >
          {Math.round(progress * 3.2)}
        </motion.span>
        <span className="text-[10px] font-black text-brand-red uppercase tracking-[0.3em]">KM/H</span>
      </div>

      {/* Needle */}
      <motion.div
        className="absolute bottom-1/2 left-1/2 w-1 h-28 bg-brand-red origin-bottom -translate-x-1/2"
        initial={{ rotate: -120 }}
        animate={{ rotate: rotation }}
        transition={{ type: 'spring', stiffness: 50, damping: 10 }}
      >
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-brand-red rounded-full shadow-[0_0_15px_rgba(255,0,0,0.8)]" />
      </motion.div>

      {/* Center Cap */}
      <div className="absolute w-4 h-4 bg-white rounded-full z-20 border-2 border-black" />
      
      {/* RPM Glow */}
      <motion.div 
        className="absolute inset-0 rounded-full"
        animate={{ 
          boxShadow: isRunning 
            ? [`0 0 20px rgba(255,0,0,0)`, `0 0 40px rgba(255,0,0,0.2)`, `0 0 20px rgba(255,0,0,0)`] 
            : 'none' 
        }}
        transition={{ repeat: Infinity, duration: 0.5 }}
      />
    </div>
  );
}
