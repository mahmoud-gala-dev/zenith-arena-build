import {
  Goal,
  Timer,
  Warehouse,
  LayoutGrid,
  Waves,
  Wrench,
  ShieldCheck,
  Cpu,
  PackageCheck,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  Goal,
  Timer,
  Warehouse,
  LayoutGrid,
  Waves,
  Wrench,
  ShieldCheck,
  Cpu,
  PackageCheck,
  BadgeCheck,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const Cmp = map[name] ?? Goal;
  return <Cmp className={className} />;
}
