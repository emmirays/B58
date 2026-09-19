export function GridOverlay({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={
        "pointer-events-none fixed inset-0 " +
        "bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] " +
        "bg-size-[6rem_10rem] " +
        className
      }
    />
  );
}
