import Swal from "sweetalert2";

/**
 * Themed SweetAlert2 confirmation used everywhere instead of window.confirm().
 * Returns true when the user confirms.
 */
export async function confirmDialog(options: {
  title?: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}): Promise<boolean> {
  const {
    title = "هل أنت متأكد؟ / Are you sure?",
    text,
    confirmText = "تأكيد / Confirm",
    cancelText = "إلغاء / Cancel",
    danger = true,
  } = options;

  const isRtl =
    typeof document !== "undefined" && document.documentElement.getAttribute("dir") === "rtl";

  const result = await Swal.fire({
    title,
    text,
    icon: danger ? "warning" : "question",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    focusCancel: true,
    ...(isRtl ? { customClass: { popup: "swal2-rtl" } } : {}),
    buttonsStyling: false,
    customClass: {
      popup: "rounded-xl bg-background text-foreground border border-border",
      title: "text-foreground text-lg",
      htmlContainer: "text-muted-foreground text-sm",
      actions: "gap-2",
      confirmButton: danger
        ? "inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90"
        : "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90",
      cancelButton:
        "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent",
    },
  });

  return result.isConfirmed;
}

/** Convenience wrapper for delete confirmations. */
export function confirmDelete(text?: string) {
  return confirmDialog({ title: "تأكيد الحذف / Confirm delete", text, confirmText: "حذف / Delete" });
}
