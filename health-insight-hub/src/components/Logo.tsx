import React from 'react';

export const Logo = ({ className = "w-8 h-8" }: { className?: string }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Medical Cross Background */}
      <rect x="13" y="4" width="6" height="24" rx="1.5" fill="#10B981" opacity="0.9" />
      <rect x="4" y="13" width="24" height="6" rx="1.5" fill="#10B981" opacity="0.9" />
      
      {/* ECG Pulse Line overlaying the cross */}
      <path 
        d="M2 16 L8 16 L11 9 L15 24 L19 12 L22 16 L30 16" 
        stroke="#2563EB" 
        strokeWidth="3.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Logo;
