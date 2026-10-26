interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export const SkeletonCard = ({ lines = 3, className = "" }: SkeletonCardProps) => {
  return (
    <div className={`surface-card p-4 sm:p-5 ${className}`}>
      <div className="h-4 w-40 animate-pulse rounded bg-[color:var(--accent-soft)]" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-3 animate-pulse rounded bg-[color:var(--accent-soft)]"
            style={{ width: `${Math.max(55, 95 - index * 10)}%` }}
          />
        ))}
      </div>
    </div>
  );
};
