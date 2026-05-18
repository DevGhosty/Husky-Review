import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, FileSearch, Map } from 'lucide-react';
import { HeroSection } from '../components/hero-section';
import { TrustSection } from '../components/trust-section';
import { Surface } from '../components/layout/surface';

const workflow = [
  {
    title: 'Upload a resume',
    detail: 'Add your resume and the role you are targeting so every comparison stays tied to that posting.',
    icon: ClipboardCheck,
  },
  {
    title: 'Compare the posting',
    detail: 'Get a structured gap review: strengths, gaps, and missing signals mapped directly to the job requirements.',
    icon: FileSearch,
  },
  {
    title: 'Save and plan',
    detail: 'Keep reviews in your workspace, promote recommendations into a week-by-week board, and adjust priorities as you go.',
    icon: Map,
  },
];

export function MarketingPage() {
  const navigate = useNavigate();

  function startPreview() {
    navigate('/login');
  }

  return (
    <main>
      <HeroSection onStartReview={startPreview} />

      <section id="how-it-works" className="mx-auto max-w-[86rem] px-5 py-12 sm:px-8 lg:px-12">
        <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-stretch">
          <Surface variant="dark" className="relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
            <div className="absolute -right-20 -top-20 size-64 rounded-full bg-husky-gold/20 blur-3xl" aria-hidden="true" />
            <h2 className="relative font-display text-4xl font-black leading-[0.98] text-white sm:text-5xl">
              From resume gaps to a working action board.
            </h2>
            <p className="relative mt-5 text-base font-medium leading-7 text-white/80">
              This page walks through how Husky-Review works. In the app, students upload a resume and job description, run the gap review, save versions, and turn recommendations into a dated action board. Continue with Google on the sign-in screen when you are ready to keep progress in your workspace.
            </p>
          </Surface>

          <div className="grid gap-4 md:grid-cols-3">
            {workflow.map((item, index) => {
              const Icon = item.icon;
              const staggerMs = Math.min(index * 60, 180);
              return (
                <Surface
                  key={item.title}
                  variant="card"
                  className="motion-safe:animate-fade-up motion-reduce:animate-none rounded-[1.6rem] border border-border/80 p-5 shadow-soft transition-[border-color,box-shadow,transform] duration-motion-normal ease-brand hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md active:scale-[0.99] motion-safe:hover:-translate-y-0.5 dark:hover:border-primary/35"
                  style={{ animationDelay: `${staggerMs}ms` }}
                >
                  <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/12 to-husky-gold/20 text-primary shadow-soft">
                    <Icon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-xl font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">{item.detail}</p>
                </Surface>
              );
            })}
          </div>
        </div>
      </section>

      <TrustSection />
    </main>
  );
}
