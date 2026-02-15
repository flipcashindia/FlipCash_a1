import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string; 
  icon?: any; // 👈 Added icon to satisfy AssignPartner.tsx
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  // 👈 Destructure helpText and icon so they don't leak into the HTML input
  ({ label, error, helpText, icon: Icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        
        <div className="relative">
          {/* Render the Icon if it is provided */}
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-5 w-5 text-gray-400" />
            </div>
          )}
          
          <input
            ref={ref}
            className={cn(
              'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all',
              Icon && 'pl-10', // 👈 Add left padding if an icon exists
              error && 'border-red-500 focus:ring-red-500',
              className
            )}
            {...props}
          />
        </div>

        {/* Render Help Text if provided (and hide it if there's an error showing instead) */}
        {helpText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helpText}</p>
        )}
        
        {/* Render Error */}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);