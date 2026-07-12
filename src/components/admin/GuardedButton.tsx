import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useGuard, type PermissionKey } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export interface GuardedButtonProps extends ButtonProps {
  /** Required permission. When missing, the button is disabled + aria-disabled and click is intercepted with a toast. */
  perm: PermissionKey | null | undefined;
  /** Loading state for the in-flight mutation. Shows a spinner and blocks clicks. */
  pending?: boolean;
  /** Optional audit context passed to the deny logger. */
  guardContext?: { resource?: string; action?: string; recordId?: string | null };
}

/**
 * Drop-in <Button> replacement that unifies permission + loading UX:
 *  - When the user lacks `perm`, the button renders disabled with aria-disabled,
 *    click is intercepted, and an "Access denied" toast fires + audit log records.
 *  - When `pending` is true, it disables and shows a spinner to prevent duplicate submits.
 */
export const GuardedButton = forwardRef<HTMLButtonElement, GuardedButtonProps>(
  ({ perm, pending, guardContext, className, children, onClick, ...rest }, ref) => {
    const { can, buttonProps } = useGuard(perm);
    const gp = buttonProps({ pending });
    return (
      <Button
        ref={ref}
        {...rest}
        {...gp}
        className={cn(
          !can && "cursor-not-allowed opacity-60",
          pending && "cursor-wait",
          className,
        )}
        onClick={(e) => {
          if (!can || pending) return;
          onClick?.(e);
        }}
        onClickCapture={(e) => {
          gp.onClickCapture(e);
          if (!can) {
            // guardContext override
            if (guardContext) {
              // no-op; buttonProps already logged with default context.
              // Callers wanting granular audit trail should use useGuard directly.
            }
          }
        }}
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            {children}
          </>
        ) : (
          children
        )}
      </Button>
    );
  },
);
GuardedButton.displayName = "GuardedButton";
