import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Droplets } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';

export default function AlarmScreen() {
  const { snoozeAlarm, setAlarmUIVisible, setActiveTab } = useStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGoToLog = () => {
    setActiveTab('dashboard');
    snoozeAlarm(); // Stops ringing and hides UI
  };

  return (
    <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col items-center justify-between py-12 px-6 overflow-hidden">
      {/* Crisp Background Graphics */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <svg className="w-full h-full opacity-15" viewBox="0 0 400 800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            animate={{
              d: [
                "M0 400 Q100 350 200 400 T400 400 L400 800 L0 800 Z",
                "M0 400 Q100 450 200 400 T400 400 L400 800 L0 800 Z",
                "M0 400 Q100 350 200 400 T400 400 L400 800 L0 800 Z"
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            fill="url(#grad)"
          />
          <g stroke="var(--primary)" strokeWidth="0.5" fill="none" className="opacity-20">
            <circle cx="200" cy="400" r="100" />
            <circle cx="200" cy="400" r="150" />
            <circle cx="200" cy="400" r="200" />
          </g>
        </svg>
      </div>

      <div className="flex flex-col items-center space-y-2 relative z-10 pt-16">
        <motion.h1 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-6xl font-extralight tracking-tighter"
        >
          {format(time, 'h:mm')}
          <span className="text-2xl ml-1 font-light opacity-60">{format(time, 'a')}</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-primary font-black tracking-[0.25em] uppercase text-center px-8"
        >
          Chaituli It's time to drink water
        </motion.p>
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10">
        <div className="flex flex-col items-center gap-20">
          <div className="relative w-72 h-72 flex items-center justify-center">
            {/* Pulsing Outer Rings */}
            <motion.div 
              animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 border-[0.5px] border-primary rounded-full" 
            />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.03, 0.08, 0.03] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              className="absolute inset-0 border-[0.5px] border-primary rounded-full" 
            />

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGoToLog}
              className="relative z-10 w-64 h-64 flex flex-col items-center justify-center group cursor-pointer"
            >
              {/* The Droplet Icon */}
              <div className="relative mb-4">
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Droplets 
                    className="w-28 h-28 text-primary opacity-90" 
                    strokeWidth={1} 
                  />
                </motion.div>
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-125 -z-10" />
              </div>

              {/* Log Intake Text */}
              <span className="text-primary font-bold text-base uppercase tracking-[0.4em] mt-1">
                Log Intake
              </span>
            </motion.button>
          </div>

          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            onClick={() => snoozeAlarm()}
            className="px-12 py-4 rounded-full bg-muted/20 backdrop-blur-md border border-white/10 hover:bg-muted/30 transition-all active:scale-95"
          >
            <span className="text-xs text-foreground/80 font-bold uppercase tracking-[0.3em]">
              Snooze for 15m
            </span>
          </motion.button>
        </div>
      </div>

      <div className="text-center relative z-10">
        <p className="text-primary/60 text-[8px] font-black uppercase tracking-[0.5em] animate-pulse">
          Hydration Required
        </p>
      </div>
    </div>
  );
}
