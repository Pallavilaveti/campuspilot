import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CalendarCheck,
  FileText,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500">
              <Brain className="h-6 w-6" />
            </div>

            <span className="text-xl font-bold">
              CampusPilot
            </span>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Open Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-24 pt-24">
        <div className="max-w-4xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
            <Sparkles className="h-4 w-4" />
            Agentic AI for Students
          </div>

          <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            Your academic life.
            <br />
            <span className="text-blue-400">
              One intelligent pilot.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
            CampusPilot transforms scattered college notices,
            announcements and documents into actionable tasks,
            deadlines and alerts — while keeping you in control.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3.5 font-semibold transition hover:bg-blue-400"
            >
              Launch CampusPilot
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/upload"
              className="flex items-center gap-2 rounded-xl border border-slate-700 px-6 py-3.5 font-semibold transition hover:bg-slate-900"
            >
              <FileText className="h-5 w-5" />
              Analyze a Notice
            </Link>
          </div>
        </div>

        {/* Product Preview */}
        <div className="mt-20 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
          <div className="border-b border-slate-800 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <div className="h-3 w-3 rounded-full bg-green-400" />

              <span className="ml-3 text-sm text-slate-500">
                CampusPilot Dashboard
              </span>
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-3">
            <PreviewCard
              title="Urgent"
              value="2"
              description="Need your attention"
            />

            <PreviewCard
              title="Upcoming"
              value="4"
              description="Tasks this week"
            />

            <PreviewCard
              title="Completed"
              value="8"
              description="Tasks completed"
            />
          </div>

          <div className="grid gap-6 border-t border-slate-800 p-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-slate-300">
                AI Agent Activity
              </p>

              <div className="mt-4 space-y-3">
                <Activity text="Analyzed examination notice" />
                <Activity text="Detected submission deadline" />
                <Activity text="Created task: Submit exam form" />
              </div>
            </div>

            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">
              <div className="flex gap-3">
                <ShieldCheck className="h-5 w-5 text-yellow-400" />

                <div>
                  <p className="font-semibold">
                    Human approval required
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    The agent detected a potential schedule
                    conflict and is waiting for your decision.
                  </p>

                  <button className="mt-4 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-950">
                    Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              What CampusPilot does
            </p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              From information to action.
            </h2>

            <p className="mt-4 text-slate-400">
              CampusPilot doesn't just answer questions. It
              understands what needs to happen next.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Feature
              icon={<Brain />}
              title="Understand"
              description="AI reads academic notices and identifies important dates, requirements and instructions."
            />

            <Feature
              icon={<CalendarCheck />}
              title="Plan"
              description="The agent converts information into personalized tasks, deadlines and events."
            />

            <Feature
              icon={<ShieldCheck />}
              title="Stay in Control"
              description="Important actions require your approval before the agent proceeds."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>CampusPilot — Agentic AI for students</p>

          <p>Built for WCC Launchpad 30</p>
        </div>
      </footer>
    </main>
  );
}

function PreviewCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
      <p className="text-sm text-slate-500">{title}</p>

      <p className="mt-2 text-3xl font-bold">{value}</p>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

function Activity({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-950 p-3">
      <CheckCircle2 className="h-4 w-4 text-green-400" />

      <span className="text-sm text-slate-400">
        {text}
      </span>
    </div>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-7 transition hover:border-slate-700">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
        {icon}
      </div>

      <h3 className="mt-6 text-xl font-semibold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-slate-400">
        {description}
      </p>
    </div>
  );
}