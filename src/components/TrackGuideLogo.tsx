import React from 'react';

interface TrackGuideLogoProps {
  className?: string;
}

export const TrackGuideLogo: React.FC<TrackGuideLogoProps> = ({ className = "w-4 h-4" }) => (
  <div className={`${className} bg-orange-500 transform rotate-45 flex items-center justify-center`}>
    <div className="w-1/2 h-1/2 bg-white transform -rotate-45"></div>
  </div>
);