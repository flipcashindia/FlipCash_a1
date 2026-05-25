// components/UI/Loader.tsx
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function Loader({ size = 'md', text }: LoaderProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className={`${sizes[size]} text-primary animate-spin`} />
      {text && <p className="mt-4 text-gray-600">{text}</p>}
    </div>
  );
}