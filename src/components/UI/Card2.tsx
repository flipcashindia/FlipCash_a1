import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white rounded-xl shadow-sm border border-gray-100 p-5", className)}>
    {children}
  </div>
);
