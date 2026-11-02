# PawConnect — Unified Global Toast System Documentation

## 1. Architecture & Design Principles

PawConnect implements a single, high-fidelity global graphical toast notification system powered by `Sonner` and encapsulated within `@/lib/utils/toast`.

### Architectural Rules
1. **Single Point of Configuration:** A single `<Toaster />` component is mounted in the root provider tree (`src/providers/AppProviders.tsx`), configured with fixed positioning (`bottom-right`), theme tokens, explicit close buttons, and an expanded hover view.
2. **Strict Import Ban:** Direct imports of `toast` or `Toaster` from `"sonner"` in feature components and routes are strictly forbidden. All components import semantic methods or the wrapped `toast` instance from `@/lib/utils/toast`.
3. **Smart Message Deduplication:** Rapid repeated clicks or batch network errors are deduplicated with a 2000ms cooldown window using composite key hashing (`${title}::${description ?? ""}`).
4. **Rich Semantic Icons:** Every toast category is paired with a distinct Lucide icon (`CheckCircle2`, `AlertCircle`, `AlertTriangle`, `Info`, `Loader2`) styled with design token colors.

---

## 2. Toaster Root Configuration

Defined in `src/components/ui/toast.tsx` and mounted in `AppProviders` (`src/providers/AppProviders.tsx`):

```tsx
<Toaster
  position="bottom-right"
  expand={false}
  richColors={false}
  closeButton
  duration={4000}
  toastOptions={{
    className:
      "group toast rounded-2xl border border-border bg-card text-card-foreground shadow-lg font-sans py-3.5 px-4 text-sm font-medium",
    classNames: {
      title: "font-semibold text-foreground text-sm",
      description: "text-muted-foreground text-xs mt-0.5 leading-relaxed",
      actionButton: "bg-primary text-primary-foreground font-semibold rounded-lg text-xs px-3 py-1.5",
      cancelButton: "bg-muted text-muted-foreground font-medium rounded-lg text-xs px-3 py-1.5",
      closeButton: "border-border bg-background text-muted-foreground hover:text-foreground",
    },
  }}
/>
```

---

## 3. Semantic Toast Methods & Usage

The utility at `src/lib/utils/toast.ts` provides dedicated semantic handlers:

### 3.1 `showSuccess(title, description?, action?)`
Displays positive confirmation upon successful completion of user mutations.
- **Icon:** `<CheckCircle2 className="h-5 w-5 text-emerald-500" />`
- **Default Duration:** 4000ms
```typescript
import { showSuccess } from "@/lib/utils/toast";

showSuccess("Pet Registered", "Buddy has been successfully added to your profile.");
```

### 3.2 `showError(title, description?, action?)`
Displays critical errors, rejected actions, and unmapped server exceptions.
- **Icon:** `<AlertCircle className="h-5 w-5 text-destructive" />`
- **Default Duration:** 5000ms
```typescript
import { showError } from "@/lib/utils/toast";

showError("Appointment Conflict", "The selected time slot is no longer available.");
```

### 3.3 `showWarning(title, description?, action?)`
Displays notices for non-blocking concerns, such as low stock or approaching deadlines.
- **Icon:** `<AlertTriangle className="h-5 w-5 text-amber-500" />`
- **Default Duration:** 4500ms
```typescript
import { showWarning } from "@/lib/utils/toast";

showWarning("Low Stock Alert", "Only 2 units remain for this item.");
```

### 3.4 `showInfo(title, description?, action?)`
Displays informational notices, such as link copies, background syncs, or guide alerts.
- **Icon:** `<Info className="h-5 w-5 text-sky-500" />`
- **Default Duration:** 4000ms
```typescript
import { showInfo } from "@/lib/utils/toast";

showInfo("Link Copied", "Booking reference copied to clipboard.");
```

### 3.5 `showLoading(title, description?)`
Displays an active spinner indicator during long-running asynchronous workflows.
- **Icon:** `<Loader2 className="h-5 w-5 text-primary animate-spin" />`
- **Returns:** Toast ID string for programmatic dismissal or updates.
```typescript
import { showLoading, dismissToast } from "@/lib/utils/toast";

const toastId = showLoading("Processing Payment", "Connecting to secure payment gateway...");
try {
  await completeOrder();
  dismissToast(toastId);
  showSuccess("Order Confirmed", "Your receipt has been sent to your email.");
} catch {
  dismissToast(toastId);
}
```

---

## 4. Deduplication Engine Architecture

To prevent notification floods caused by rapid button clicks or concurrent API rejects, `toast.ts` tracks a short-lived memory registry:

```typescript
const recentToasts = new Map<string, number>();
const DEDUP_COOLDOWN_MS = 2000;

function isDuplicate(key: string): boolean {
  const now = Date.now();
  const lastShown = recentToasts.get(key);
  if (lastShown && now - lastShown < DEDUP_COOLDOWN_MS) {
    return true;
  }
  recentToasts.set(key, now);
  
  // Clean entries older than 10 seconds
  for (const [k, ts] of recentToasts.entries()) {
    if (now - ts > 10000) recentToasts.delete(k);
  }
  return false;
}
```

---

## 5. Portal Action & Toast Notification Catalog

| Portal / Module | Action Trigger | Notification Type | Title | Message Description |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | Sign in successful | `showSuccess` | Sign In Successful | Welcome back to PawConnect! |
| **Auth** | Registration complete | `showSuccess` | Account Created | Your account is ready. Please log in. |
| **Auth** | Password reset email | `showSuccess` | Reset Link Sent | Check your inbox for recovery instructions. |
| **Customer** | Pet added | `showSuccess` | Pet Added | New companion registered successfully. |
| **Customer** | Pet deleted | `showSuccess` | Pet Removed | Companion profile removed from records. |
| **Customer** | Vaccination recorded | `showSuccess` | Vaccine Recorded | Immunization saved to pet medical history. |
| **Customer** | Medical record added | `showSuccess` | Record Saved | Clinical note added to pet profile. |
| **Customer** | Address saved | `showSuccess` | Address Saved | Delivery location updated in profile. |
| **Customer** | Password changed | `showSuccess` | Password Updated | Your account password has been changed. |
| **Customer** | Booking submitted | `showSuccess` | Booking Submitted | Your appointment request has been scheduled. |
| **Customer** | Booking cancelled | `showSuccess` | Booking Cancelled | Appointment cancelled successfully. |
| **Customer** | Order placed | `showSuccess` | Order Confirmed | Thank you! Your items are being prepared. |
| **Customer** | Review submitted | `showSuccess` | Review Submitted | Thank you for sharing your feedback! |
| **Customer** | Item added to cart | `showSuccess` | Added to Cart | Product added to your shopping bag. |
| **Professional** | Profile updated | `showSuccess` | Profile Updated | Practitioner profile updated successfully. |
| **Professional** | Service created/edited | `showSuccess` | Service Saved | Catalog offerings updated. |
| **Professional** | Schedule adjusted | `showSuccess` | Availability Saved | Weekly operating hours updated. |
| **Professional** | Booking status update | `showSuccess` | Status Updated | Appointment moved to selected status. |
| **Admin** | User updated | `showSuccess` | User Updated | Account permissions and status modified. |
| **Admin** | User status toggle | `showSuccess` | Status Updated | User account status toggled. |
| **Admin** | Practitioner verified | `showSuccess` | Verification Updated | Practitioner credentials verified. |
| **Admin** | Practitioner rejected | `showWarning` | Application Rejected | Rejection reason recorded and sent. |
| **Admin** | Product created/updated | `showSuccess` | Product Saved | Catalog inventory updated. |
| **Admin** | Category saved | `showSuccess` | Category Saved | Product category created or edited. |
| **Admin** | Order status changed | `showSuccess` | Order Updated | Order fulfillment stage updated. |
| **Admin** | Review moderated | `showSuccess` | Review Moderated | Moderation action applied to review. |
| **Admin** | Platform settings saved | `showSuccess` | Settings Saved | Global platform parameters updated. |
