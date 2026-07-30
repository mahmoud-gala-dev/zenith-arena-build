import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { setUserPassword } from "@/lib/admin-users.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*-_=+?";

function generatePassword(length = 20): string {
  const all = UPPER + LOWER + DIGITS + SYMBOLS;
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  const pick = (set: string, n: number) => set[n % set.length];
  const chars = [
    pick(UPPER, bytes[0]),
    pick(LOWER, bytes[1]),
    pick(DIGITS, bytes[2]),
    pick(SYMBOLS, bytes[3]),
    ...Array.from(bytes.slice(4), (n) => pick(all, n)),
  ];
  // Fisher–Yates with fresh randomness so the guaranteed classes aren't positional.
  const order = new Uint32Array(chars.length);
  crypto.getRandomValues(order);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = order[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

const RULES = [
  { label: "12+ characters", test: (v: string) => v.length >= 12 },
  { label: "lowercase", test: (v: string) => /[a-z]/.test(v) },
  { label: "uppercase", test: (v: string) => /[A-Z]/.test(v) },
  { label: "digit", test: (v: string) => /[0-9]/.test(v) },
  { label: "symbol", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

export function ResetPasswordDialog({
  userId,
  email,
  disabled,
}: {
  userId: string;
  email: string | null;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const run = useServerFn(setUserPassword);

  const failed = RULES.filter((r) => !r.test(password));
  const valid = password.length > 0 && failed.length === 0;

  async function save() {
    if (!valid) return;
    setSaving(true);
    try {
      await run({ data: { userId, password } });
      toast.success("Password updated", {
        description: `${email ?? "The user"} must sign in with the new password.`,
      });
      setPassword("");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update the password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setPassword("");
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <KeyRound className="mr-2 h-4 w-4" /> Reset password
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            Set a new password for {email ?? userId}. Only super admins can do this, and the change is
            recorded in the audit log.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              autoComplete="new-password"
              spellCheck={false}
            />
            <Button type="button" variant="secondary" onClick={() => setPassword(generatePassword())}>
              <RefreshCw className="mr-2 h-4 w-4" /> Generate
            </Button>
          </div>
          <ul className="flex flex-wrap gap-2 text-xs">
            {RULES.map((rule) => {
              const ok = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={
                    ok
                      ? "rounded-full bg-primary/10 px-2 py-1 text-primary"
                      : "rounded-full bg-secondary px-2 py-1 text-muted-foreground"
                  }
                >
                  {rule.label}
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-muted-foreground">
            Copy the password before saving — it is never shown again.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={!valid || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
