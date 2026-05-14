import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, FileSearch, Map } from 'lucide-react';
import { HeroSection } from '../components/hero-section';
import { TrustSection } from '../components/trust-section';
import { Surface } from '../components/layout/surface';

const workflow = [
  {
    title: 'Upload a resume',
    detail: 'Begin with a student resume and a specific role target.',
    icon: ClipboardCheck,
  },
  {
    title: 'Compare the posting',
    detail: 'Preview how gaps, strengths, and missing signals could be organized.',
    icon: FileSearch,
  },
  {
    title: 'Build a UWB roadmap',
    detail: 'Turn the review into campus-connected activities and next steps.',
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
              The public page explains the product. The app area is where students upload, review, save, and plan. Google sign-in is represented as UI only for now.
            </p>
          </Surface>

          <div className="grid gap-4 md:grid-cols-3">
            {workflow.map((item) => {
              const Icon = item.icon;
              return (
                <Surface
                  key={item.title}
                  variant="card"
                  className="rounded-[1.6rem] border border-border/80 p-5 shadow-soft transition-shadow duration-200 hover:border-primary/25 hover:shadow-md dark:hover:border-primary/35"
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
