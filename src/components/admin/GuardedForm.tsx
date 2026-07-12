import { forwardRef, type FormHTMLAttributes, type FormEvent } from "react";
import { useGuard, type PermissionKey } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export interface GuardedFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  perm: PermissionKey | null | undefined;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void | Promise<void>;
  /** When true, disables interactive descendants via fieldset[disabled]. */
  disableWhenBlocked?: boolean;
  guardContext?: { resource?: string; action?: string; recordId?: string | null };
}

/**
 * Form wrapper that fully prevents submit when the user lacks `perm`.
 * - preventDefault + stopPropagation on blocked submits
 * - aria-disabled on the <form>
 * - optional fieldset[disabled] wrapper to gray out and block every child input/button
 */
export const GuardedForm = forwardRef<HTMLFormElement, GuardedFormProps>(
  ({ perm, onSubmit, disableWhenBlocked = true, guardContext, className, children, ...rest }, ref) => {
    const { can, submitProps } = useGuard(perm);
    const sp = submitProps(onSubmit, guardContext);
    return (
      <form
        ref={ref}
        {...rest}
        {...sp}
        className={cn(!can && "opacity-90", className)}
      >
        {disableWhenBlocked ? (
          <fieldset disabled={!can} className="contents">
            {children}
          </fieldset>
        ) : (
          children
        )}
      </form>
    );
  },
);
GuardedForm.displayName = "GuardedForm";
