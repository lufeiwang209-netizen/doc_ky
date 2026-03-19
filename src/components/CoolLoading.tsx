import React from 'react';
import { motion } from 'motion/react';

export const CoolLoading: React.FC<{ message?: string }> = ({ message = "AI 正在分析临床数据..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-6">
      <div className="relative w-24 h-24">
        {/* DNA-like helix animation */}
        <div className="absolute inset-0 flex items-center justify-center">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-emerald-500"
              animate={{
                y: [0, -40, 0, 40, 0],
                x: [Math.sin(i) * 20, Math.sin(i + Math.PI) * 20, Math.sin(i) * 20],
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
        
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 border-2 border-emerald-500/20 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-2 border border-blue-500/30 rounded-full border-dashed"
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
      </div>
      
      <div className="text-center">
        <motion.p
          className="text-emerald-400 font-mono text-sm tracking-widest uppercase glow-text"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {message}
        </motion.p>
        <div className="mt-2 w-48 h-1 bg-slate-800 rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full bg-gradient-to-right from-emerald-500 to-blue-500"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
};
