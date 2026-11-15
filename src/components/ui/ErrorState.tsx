import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We could not load this data. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-6 text-center">
      <div className="h-14 w-14 rounded-2xl bg-danger-500/10 border border-danger-500/20 flex items-center justify-center">
        <AlertCircle className="h-7 w-7 text-danger-400" />
      </div>
      <div>
        <h3 className="text-gray-100 font-semibold text-base">{title}</h3>
        <p className="text-ink-300 text-sm mt-1 max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  );
}
