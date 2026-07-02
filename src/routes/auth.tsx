import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Lock, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin Sign In — Egytic Sports" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email({ message: "Invalid email" }).max(255),
  password: z.string().min(8, { message: "At least 8 characters" }).max(128),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/admin" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Welcome back");
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
        data: { full_name: fullName || email },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Account created. You can sign in now.");
  }

  return (
    <SiteLayout>
      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center py-16">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-soft">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-foreground">Admin Portal</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to manage leads, projects and content.
            </p>
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="mt-4 space-y-4">
                <Field id="email" label="Email" icon={<Mail className="h-4 w-4" />}>
                  <Input id="email" type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)} maxLength={255} />
                </Field>
                <Field id="password" label="Password" icon={<Lock className="h-4 w-4" />}>
                  <Input id="password" type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={128} />
                </Field>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="mt-4 space-y-4">
                <Field id="name" label="Full name">
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
                </Field>
                <Field id="email2" label="Email" icon={<Mail className="h-4 w-4" />}>
                  <Input id="email2" type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)} maxLength={255} />
                </Field>
                <Field id="password2" label="Password" icon={<Lock className="h-4 w-4" />}>
                  <Input id="password2" type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)} minLength={8} maxLength={128} />
                </Field>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  New accounts have no admin role by default. Ask a super-admin to grant access.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({ id, label, icon, children }: { id: string; label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}
