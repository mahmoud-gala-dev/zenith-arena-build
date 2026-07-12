import { useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ICON_NAMES: string[] = Object.keys(Icons).filter(
  (k) =>
    /^[A-Z]/.test(k) &&
    !k.endsWith("Icon") &&
    k !== "createLucideIcon" &&
    k !== "default" &&
    typeof (Icons as unknown as Record<string, unknown>)[k] === "object" === false &&
    typeof (Icons as unknown as Record<string, unknown>)[k] === "function",
);

interface IconPickerProps {
  value: string | null | undefined;
  onChange: (name: string) => void;
  className?: string;
}

export function IconPicker({ value, onChange, className }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? ICON_NAMES.filter((n) => n.toLowerCase().includes(q)) : ICON_NAMES;
    return list.slice(0, 240);
  }, [query]);

  const Current =
    (value && (Icons as unknown as Record<string, typeof Icons.Star>)[value]) || Icons.Star;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("h-10 w-full justify-start gap-2", className)}
        >
          <Current className="h-4 w-4" />
          <span className="truncate text-sm">{value || "Pick icon"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search icons…"
          className="mb-2 h-9"
        />
        <div className="grid max-h-72 grid-cols-6 gap-1 overflow-y-auto">
          {filtered.map((name) => {
            const Cmp = (Icons as unknown as Record<string, typeof Icons.Star>)[name];
            return (
              <button
                key={name}
                type="button"
                title={name}
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-md border border-transparent hover:border-primary hover:bg-primary/5",
                  value === name && "border-primary bg-primary/10",
                )}
              >
                <Cmp className="h-4 w-4" />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-6 py-4 text-center text-xs text-muted-foreground">
              No icons match "{query}"
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
