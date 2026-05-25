// import React from 'react';

export const Badge = ({ text }: { text?: string }) => {
  const styles: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    neutral: "bg-gray-100 text-gray-700",
    primary: "bg-blue-100 text-blue-700"
  };

  let styleKey = 'neutral';
  const lowerText = text?.toLowerCase() || '';

  if (['active', 'verified', 'completed', 'success', 'resolved'].includes(lowerText)) styleKey = 'success';
  else if (['pending', 'verifying', 'open'].includes(lowerText)) styleKey = 'warning';
  else if (['rejected', 'inactive', 'cancelled', 'failed', 'blocked'].includes(lowerText)) styleKey = 'danger';
  else if (['direct'].includes(lowerText)) styleKey = 'primary';

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[styleKey]}`}>
      {text || 'N/A'}
    </span>
  );
};