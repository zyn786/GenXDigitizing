export function OrderProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-white transition-[width]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
