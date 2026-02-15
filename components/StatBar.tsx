
import React from 'react';

interface StatBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  icon?: React.ReactNode;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, max, color, icon }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1 text-sm font-medium">
        <span className="flex items-center gap-2">
          {icon} {label}
        </span>
        <span>{Math.round(value)} / {max}</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500 ease-out`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default StatBar;
