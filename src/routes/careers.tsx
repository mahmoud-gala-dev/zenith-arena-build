import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { MapPin, Briefcase, ArrowRight, HelpCircle, type LucideIcon } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHero } from "@/components/site/PageHero";
import { Reveal } from "@/components/site/Reveal";
import { NotFound } from "@/components/site/NotFound";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLang } from "@/i18n/LanguageProvider";
import { jobOpeningsOpenQueryOptions, careersPageSettingsQueryOptions, type JobOpening } from "@/lib/queries";
import { submitApplication } from "@/lib/applications.functions";

export const Route = createFileRoute("/careers")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(jobOpeningsOpenQueryOptions);
    context.queryClient.ensureQueryData(careersPageSettingsQueryOptions);
  },
  head: () => ({
    meta: [
      { title: "Careers at Egytic — Build the World's Best Sports Facilities" },
      { name: "description", content: "Join Egytic and help build FIFA-grade pitches, Olympic tracks and world-class arenas across the Middle East and North Africa." },
      { property: "og:title", content: "Careers at Egytic Sports" },
      { property: "og:description", content: "Open roles in engineering, project management and operations." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-8 text-center text-destructive">{error.message}</div>,
  notFoundComponent: () => <div className="p-8 text-center">Not found</div>,
  component: CareersPage,
});

function getLucideIcon(name: string): LucideIcon {
  const registry = LucideIcons as unknown as Record<string, LucideIcon>;
  return registry[name] ?? HelpCircle;
}


function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",", 2)[1] ?? "");
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function CareersPage() {
  const { lang, t: T } = useLang();
  const ar = lang === "ar";
  const { data: jobs } = useSuspenseQuery(jobOpeningsOpenQueryOptions);
  const { data: cfg } = useSuspenseQuery(careersPageSettingsQueryOptions);
  const L = cfg.labels;

  const [selected, setSelected] = useState<JobOpening | null>(null);
  const [open, setOpen] = useState(false);

  const tx = {
    eyebrow: ar ? L.eyebrow_ar : L.eyebrow_en,
    title: ar ? L.title_ar : L.title_en,
    sub: ar ? L.sub_ar : L.sub_en,
    whyTitle: ar ? L.why_title_ar : L.why_title_en,
    openTitle: ar ? L.open_title_ar : L.open_title_en,
    apply: T.pages.careers.applyNow,
    noJobsTitle: ar ? L.no_jobs_title_ar : L.no_jobs_title_en,
    noJobsSub: ar ? L.no_jobs_sub_ar : L.no_jobs_sub_en,
    sendCv: ar ? L.send_cv_ar : L.send_cv_en,
  };


  function openApply(job: JobOpening | null) {
    setSelected(job);
    setOpen(true);
  }

  return (
    <SiteLayout>
      <PageHero eyebrow={tx.eyebrow} title={tx.title} subtitle={tx.sub} />

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal><h2 className="text-2xl font-bold text-foreground">{tx.whyTitle}</h2></Reveal>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {cfg.perks.map((p, i) => {
              const Icon = getLucideIcon(p.icon);
              return (
                <Reveal key={i}>
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 font-semibold text-foreground">{ar ? p.title_ar : p.title_en}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{ar ? p.desc_ar : p.desc_en}</p>
                  </div>
                </Reveal>
              );
            })}

          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal><h2 className="text-2xl font-bold text-foreground">{tx.openTitle}</h2></Reveal>
          <div className="mt-8 space-y-3">
            {jobs.length === 0 && (
              <p className="text-muted-foreground">{T.pages.careers.noJobs}</p>
            )}
            {jobs.map((j) => (
              <Reveal key={j.id}>
                <div className="group flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elegant sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">
                      {ar ? j.title_ar || j.title_en : j.title_en}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {(ar ? j.department_ar : j.department_en) && (
                        <span className="inline-flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4" /> {ar ? j.department_ar : j.department_en}
                        </span>
                      )}
                      {(ar ? j.location_ar : j.location_en) && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" /> {ar ? j.location_ar : j.location_en}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {j.employment_type}
                      </span>
                    </div>
                    {(ar ? j.description_ar : j.description_en) && (
                      <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                        {ar ? j.description_ar : j.description_en}
                      </p>
                    )}
                  </div>
                  <Button variant="hero" size="sm" onClick={() => openApply(j)}>
                    {tx.apply}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl rounded-3xl bg-ink p-10 text-center text-ink-foreground shadow-elegant sm:p-14">
          <h3 className="text-2xl font-bold sm:text-3xl">{tx.noJobsTitle}</h3>
          <p className="mt-3 text-white/70">{tx.noJobsSub}</p>
          <Button variant="gold" size="lg" className="mt-6" onClick={() => openApply(null)}>
            {tx.sendCv}
          </Button>
        </div>
      </section>

      <ApplyDialog open={open} onOpenChange={setOpen} job={selected} ar={ar} T={T} />
    </SiteLayout>
  );
}

function ApplyDialog({ open, onOpenChange, job, ar, T }: { open: boolean; onOpenChange: (v: boolean) => void; job: JobOpening | null; ar: boolean; T: ReturnType<typeof useLang>["t"] }) {
  const submit = useServerFn(submitApplication);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (!file) {
      toast.error(T.pages.careers.cvRequired);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(T.pages.careers.maxFileSize);
      return;
    }
    setBusy(true);
    try {
      const b64 = await fileToBase64(file);
      await submit({
        data: {
          job_id: job?.id ?? null,
          job_title: job ? (ar ? job.title_ar || job.title_en : job.title_en) : undefined,
          applicant_name: String(fd.get("applicant_name") || "").trim(),
          email: String(fd.get("email") || "").trim(),
          phone: String(fd.get("phone") || "").trim() || undefined,
          cover_letter: String(fd.get("cover_letter") || "").trim() || undefined,
          cv_filename: file.name,
          cv_mime: file.type || "application/pdf",
          cv_base64: b64,
          website: String(fd.get("website") || ""),
        },
      });
      toast.success(T.pages.careers.submitted);
      onOpenChange(false);
      form.reset();
      setFile(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {job
              ? `${T.pages.careers.applyFor} ${ar ? (job.title_ar || job.title_en) : job.title_en}`
              : T.pages.careers.sendYourCv}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <div>
            <Label htmlFor="applicant_name">{T.pages.careers.fullName}</Label>
            <Input id="applicant_name" name="applicant_name" required maxLength={120} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">{T.pages.careers.email}</Label>
              <Input id="email" name="email" type="email" required maxLength={255} />
            </div>
            <div>
              <Label htmlFor="phone">{T.pages.careers.phone}</Label>
              <Input id="phone" name="phone" type="tel" maxLength={40} />
            </div>
          </div>
          <div>
            <Label htmlFor="cv">{T.pages.careers.cvLabel}</Label>
            <Input id="cv" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <Label htmlFor="cover_letter">{T.pages.careers.coverLetter}</Label>
            <Textarea id="cover_letter" name="cover_letter" maxLength={3000} rows={4} />
          </div>
          <DialogFooter>
            <Button type="submit" variant="hero" disabled={busy}>
              {busy ? T.pages.careers.sending : T.pages.careers.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
