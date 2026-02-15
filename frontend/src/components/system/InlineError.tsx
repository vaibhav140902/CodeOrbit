interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const InlineError = ({ message, onRetry, className = "" }: InlineErrorProps) => {
  return (
    <div className={`rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 ${className}`}>
      <p className="text-sm text-rose-500">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-3 text-xs">
          Retry
        </button>
      )}
    </div>
  );
};
