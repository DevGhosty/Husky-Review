export function GradientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="hero-grid absolute inset-0 opacity-[0.42]" />
      <div className="absolute left-[-8rem] top-[-7rem] h-80 w-80 rounded-full bg-husky-purple/25 blur-3xl animate-glow-shift" />
      <div className="absolute right-[-8rem] top-24 h-96 w-96 rounded-full bg-husky-gold/30 blur-3xl animate-glow-shift [animation-delay:1.5s]" />
      <div className="absolute bottom-10 left-[38%] h-72 w-72 rounded-full bg-indigo-200/[0.45] blur-3xl animate-glow-shift [animation-delay:3s]" />
    </div>
  );
}
