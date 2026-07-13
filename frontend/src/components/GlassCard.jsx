import React from "react";

const GlassCard = ({ children, className = "", hoverEffect = true }) => {
  return (
    <div
      className={`glass-panel p-6 ${
        hoverEffect ? "glass-panel-hover" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default GlassCard;
