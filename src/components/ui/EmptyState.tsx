import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-6 text-center">
      {icon && (
        <div className="h-14 w-14 rounded-2xl bg-ink-800 border border-ink-700 flex items-center justify-center">
          {icon}
        </div>
      )}
      <div>
        <h3 className="text-gray-100 font-semibold text-base">{title}</h3>
        {message && <p className="text-ink-300 text-sm mt-1 max-w-xs">{message}</p>}
      </div>
      {action}
    </div>
  );
}
