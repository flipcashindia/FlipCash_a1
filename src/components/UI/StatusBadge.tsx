import { cn, getStatusColor } from '../../lib/utils';

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        getStatusColor(status)
      )}
    >
      {label || status.replace(/_/g, ' ')}
    </span>
  );
}