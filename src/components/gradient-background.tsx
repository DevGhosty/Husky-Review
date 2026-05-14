export function GradientBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="hero-gradient-field absolute inset-0" />
      <div className="hero-grid absolute inset-0 opacity-[0.42]" />
      <div className="aurora-ribbon absolute left-[20%] top-[12%] h-56 w-[58rem]" />
      <div className="corner-wash corner-wash-left absolute bottom-[-7rem] left-[-7rem] h-[22rem] w-[30rem]" />
      <div className="corner-wash corner-wash-right absolute right-[-5rem] top-[-4rem] h-[21rem] w-[28rem]" />
      <div className="curve-line curve-line-left absolute bottom-12 left-0 h-72 w-[34rem]" />
      <div className="curve-line curve-line-right absolute right-0 top-0 h-72 w-[28rem]" />
    </div>
  );
}
