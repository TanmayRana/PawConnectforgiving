# PawConnect — OpenCode Project Rules

## Read first

Before changing code, read:

- `docs/PAWCONNECT_PROJECT_BLUEPRINT.md`
- `docs/DOMAIN_RULES.md` when working on business logic
- `docs/DESIGN_SYSTEM.md` when changing UI/theme components
- `docs/ROUTE_MAP.md` when adding or changing routes

## Mission

Build PawConnect as one unified pet-care platform using a reusable design system.

The UI must feel like the uploaded Petopia template, but the feature architecture must follow PawConnect requirements.

## Core architecture

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui
- Lucide React
- TanStack Query for server state
- Zustand for small client/UI state
- React Hook Form + Zod for forms
- pnpm

## Priority order

Always prefer:

1. Existing shared component
2. Existing component variant
3. Shared domain component
4. New reusable component
5. Page-specific markup only when truly page-specific

Do not duplicate components.

## Design rules

Use centralized theme tokens.

Primary template palette:

- `#FBFBFB`
- `#272727`
- `#5A5A5A`
- `#E78585`
- `#FFDADA`
- `#FFF0D0`
- `#D0F3FF`
- `#C4DEE8`
- `#F1F1F1`
- `#A8A8A8`

Do not hardcode these values in arbitrary JSX/CSS.

Fonts:

- Inter = default application font
- Just Another Hand = decorative/marketing accent only

Card language:

- large rounded cards for public/discovery UI
- more restrained cards for dense admin/professional UI
- use consistent semantic variants

## Routing rules

Use route groups for layout separation.

Public:
- top navbar + footer

Customer:
- top application navbar

Admin:
- sidebar + topbar

Veterinarian:
- sidebar + topbar

Service Provider:
- sidebar + topbar

Do not add a permanent desktop sidebar to customer pages.

## Modal-first rule

Do not create route pages for:

- login
- registration
- forgot password
- add/edit pet
- add/edit product
- add/edit category
- add/edit user
- add/edit address
- booking forms
- review creation
- status confirmation
- payment state

Use Dialog/Drawer/Sheet/AlertDialog/Popover as appropriate.

## Authentication

Authentication UI is global and reusable.

Do not duplicate login/register markup on individual pages.

Protected actions can trigger the global auth modal.

## Vendor prohibition

There is no external vendor marketplace.

Never introduce:

- Vendor role
- Vendor dashboard
- Vendor registration
- Vendor verification
- Vendor commission
- Vendor settlement
- Vendor product ownership
- Vendor foreign keys in product UI

All products are in-house and managed by Admin.

## State management

Use TanStack Query for API-backed data.

Use Zustand only for local/client UI state.

Do not duplicate query data into global Zustand state without a strong reason.

## Forms

All non-trivial forms use:

- React Hook Form
- Zod

Validation belongs near the form boundary.

Reuse shared form fields and modal/drawer shells.

## API separation

Do not place large API request implementations in route components.

Use:

`src/lib/api/*`

and domain hooks.

## Server/client boundaries

Server Components by default.

Use `"use client"` only when necessary for:

- React state
- event handlers
- effects
- browser APIs
- client-only libraries

Do not mark entire layouts/routes as client components without justification.

## Responsive behavior

Every new component must be reviewed at:

- desktop
- tablet
- mobile

Do not merely shrink desktop layouts.

Mobile should use:

- drawers
- stacked cards
- full-width actions
- full-height complex dialogs
- mobile-friendly table patterns

## Accessibility

Every interactive element needs:

- semantic HTML
- keyboard accessibility
- focus treatment
- accessible labels
- meaningful form errors

Icon-only controls require accessible labels.

Images require useful alt text when meaningful.

## Loading/error/empty states

Data-driven UI must handle:

- loading
- success
- empty
- error

Use shared state components.

## Business rules

Do not invent backend business rules in the frontend.

Especially:

- booking availability must be backend-authoritative
- duplicate booking prevention must be backend-enforced
- review eligibility must be backend-enforced
- order/payment status must be backend-authoritative

Frontend should provide a clear representation and validation layer.

## Temporary data

Mocks belong in dedicated mock/fixture files.

Do not place large mock datasets inside pages.

## Verification

After meaningful changes, run:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Fix errors before moving to the next phase.

## Required workflow

For every task:

1. Read relevant project docs.
2. Inspect existing implementation.
3. Search for an existing component.
4. Plan the smallest reusable change.
5. Implement using existing tokens and components.
6. Verify types/lint/build.
7. Report changed files and verification.

Do not silently change architecture.

## First implementation phase

The first implementation phase is design-system-first.

Do not build full PawConnect pages until the global UI foundation exists.

Required foundation:

- theme tokens
- typography
- Button
- Input
- Textarea
- Select
- Card variants
- Dialog
- Drawer
- Sheet
- Tabs
- Accordion
- Badge
- Avatar
- Table
- Pagination
- Calendar/DatePicker
- Skeleton
- Toast
- PublicHeader
- PublicFooter
- CustomerTopbar
- AdminSidebar
- ProfessionalSidebar
- Topbar
- PageHeader
- SectionHeader
- DataTable
- SearchBar
- FilterBar
- StatusBadge
- EmptyState
- LoadingState
- ErrorState
- ConfirmDialog
- FormModal
- FormDrawer
- global auth modal shell

## Never mark foundation complete if

- colors are hardcoded in page components
- typography is inconsistent
- components are duplicated
- dialogs are page-specific
- each page has its own button/card styles
- admin and professional layouts are copied instead of shared
- mobile behavior is missing
- typecheck/lint/build fails

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
