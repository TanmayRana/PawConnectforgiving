# PawConnect — Next.js Project Setup & Coding Blueprint

## 1. Project identity

**Project:** PawConnect  
**Frontend:** Next.js App Router + TypeScript  
**Package manager:** pnpm  
**UI:** Tailwind CSS + shadcn/ui  
**Icons:** Lucide React  
**Forms:** React Hook Form + Zod  
**Server state:** TanStack Query  
**Client/UI state:** Zustand  
**Date utilities:** date-fns  
**Notifications:** Sonner

### Product architecture

PawConnect is one unified pet-care platform with these major areas:

1. Public discovery website
2. Pet Owner application
3. Veterinary portal
4. Service Provider portal
5. Admin portal
6. In-house pet-product marketplace

There is **no external vendor marketplace and no Vendor role**.

The uploaded PawConnect specification explicitly states that products are in-house, there is no Vendor role/module/workflow, login/registration are modal/dialog flows, CRUD forms are generally modal/drawer based, customer UX should feel Swiggy-style, and the Petopia template is a visual/component reference rather than the feature architecture. See the source specification around the product vision, navigation, modal-first forms, and template strategy.

---

# 2. Create the Next.js project

## Recommended environment

Use Node.js 20.9+.

Your current Node.js version is already suitable if it remains v24.x.

Verify:

```bash
node -v
pnpm -v
```

Install pnpm if needed:

```bash
npm install -g pnpm
```

## Create app

Preferred command:

```bash
pnpm create next-app@latest pawconnect --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Then:

```bash
cd pawconnect
pnpm install
pnpm dev
```

Open:

```text
http://localhost:3000
```

If the create-next-app CLI presents prompts instead of accepting a flag, choose:

```text
TypeScript       Yes
ESLint            Yes
Tailwind CSS      Yes
src/ directory    Yes
App Router        Yes
Import alias      Yes, @/*
```

Do not choose Pages Router.

---

# 3. Install the project foundation

Initialize shadcn/ui in the existing project:

```bash
pnpm dlx shadcn@latest init -b base
```

Then install project dependencies:

```bash
pnpm add lucide-react zustand @tanstack/react-query react-hook-form zod @hookform/resolvers date-fns sonner
```

Use shadcn/ui for accessible primitives rather than manually recreating dialogs, dropdowns, tabs, sheets, etc.

Recommended component additions during the foundation phase:

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add textarea
pnpm dlx shadcn@latest add select
pnpm dlx shadcn@latest add checkbox
pnpm dlx shadcn@latest add switch
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add avatar
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add drawer
pnpm dlx shadcn@latest add sheet
pnpm dlx shadcn@latest add popover
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add tabs
pnpm dlx shadcn@latest add accordion
pnpm dlx shadcn@latest add tooltip
pnpm dlx shadcn@latest add table
pnpm dlx shadcn@latest add skeleton
pnpm dlx shadcn@latest add separator
pnpm dlx shadcn@latest add breadcrumb
pnpm dlx shadcn@latest add pagination
pnpm dlx shadcn@latest add calendar
```

Only add additional primitives when the product actually needs them.

---

# 4. Technology responsibility rules

## Next.js

Use the App Router.

Use Server Components by default.

Add `"use client"` only when the component actually needs:

- state
- event handlers
- browser APIs
- effects
- client-only libraries

Do not turn entire route trees into Client Components unnecessarily.

## TanStack Query

Use TanStack Query for API/server state:

- users
- pets
- veterinarians
- providers
- services
- products
- bookings
- orders
- reviews
- notifications
- reports

Do not duplicate API data into Zustand.

## Zustand

Use Zustand for small client/UI state such as:

- authentication modal state
- mobile navigation state
- cart drawer UI state
- temporary checkout UI state
- global UI preferences

Do not use Zustand as a replacement for server-state caching.

## React Hook Form + Zod

All non-trivial forms must use:

```text
React Hook Form
+
Zod schema validation
```

Validation must exist at the form boundary.

## API access

Do not call APIs directly from random page components.

Create a central API layer:

```text
src/lib/api/
```

Keep request functions grouped by domain.

Example:

```text
src/lib/api/
  client.ts
  auth.ts
  pets.ts
  veterinarians.ts
  providers.ts
  services.ts
  products.ts
  bookings.ts
  orders.ts
  reviews.ts
  users.ts
  reports.ts
```

Keep API response types in:

```text
src/types/
```

---

# 5. Recommended source structure

```text
pawconnect/
├── .cursor/
│   └── rules/
│       └── pawconnect.mdc
├── .opencode/
│   └── agents/
│       ├── ui-reviewer.md
│       └── code-reviewer.md
├── docs/
│   ├── PAWCONNECT_PROJECT_BLUEPRINT.md
│   ├── DESIGN_SYSTEM.md
│   ├── ROUTE_MAP.md
│   └── DOMAIN_RULES.md
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (customer)/
│   │   ├── (admin)/
│   │   └── (professional)/
│   ├── components/
│   │   ├── ui/
│   │   ├── shared/
│   │   ├── public/
│   │   ├── customer/
│   │   ├── admin/
│   │   └── professional/
│   ├── config/
│   ├── hooks/
│   ├── lib/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── constants/
│   │   ├── formatters/
│   │   └── utils/
│   ├── providers/
│   ├── stores/
│   ├── types/
│   ├── validations/
│   └── styles/
└── package.json
```

Do not create a second component system inside a feature folder unless a component is truly feature-private.

---

# 6. Route architecture

Use route groups to separate layouts without changing URLs.

```text
src/app/
├── (public)/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── services/
│   │   ├── page.tsx
│   │   ├── veterinary/
│   │   ├── grooming/
│   │   └── training/
│   ├── shop/
│   ├── about/
│   ├── faq/
│   ├── contact/
│   └── not-found.tsx
│
├── (customer)/
│   └── app/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── pets/
│       ├── services/
│       ├── bookings/
│       ├── shop/
│       ├── orders/
│       └── profile/
│
├── (admin)/
│   └── admin/
│       ├── layout.tsx
│       ├── page.tsx
│       ├── users/
│       ├── veterinarians/
│       ├── service-providers/
│       ├── bookings/
│       ├── products/
│       ├── categories/
│       ├── orders/
│       ├── reviews/
│       ├── reports/
│       ├── audit-logs/
│       └── settings/
│
└── (professional)/
    ├── vet/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   ├── appointments/
    │   ├── availability/
    │   └── profile/
    └── provider/
        ├── layout.tsx
        ├── page.tsx
        ├── bookings/
        ├── services/
        ├── availability/
        └── profile/
```

Dynamic routes use:

```text
[id]
```

not manually concatenated URLs.

---

# 7. Layout architecture

There are three major visual layouts.

## Public layout

```text
PublicHeader
↓
Page content
↓
PublicFooter
```

Top navigation:

```text
Logo
Home
Services
Pet Shop
About
FAQs
Contact
Login / Sign Up
```

## Customer layout

```text
CustomerTopbar
↓
Page content
```

Customer navigation:

```text
Logo
Home
Services
Pet Shop
My Pets
My Bookings
Orders
Notifications
Profile
```

Do not introduce a permanent desktop sidebar for customers.

## Admin/professional layout

```text
Sidebar
+
Topbar
+
Main content
```

Admin sidebar:

```text
Dashboard
Users
Veterinarians
Service Providers
Bookings
Products
Categories
Orders
Reviews
Reports
Notifications
Audit Logs
Settings
```

There must be no Vendor item.

Veterinarian sidebar:

```text
Dashboard
Appointments
Availability
Profile
Settings
```

Service Provider sidebar:

```text
Dashboard
Bookings
Services
Availability
Profile
Settings
```

---

# 8. Design system — Petopia-derived visual language

The uploaded template's visual system should be adapted, not copied as a feature architecture.

## Core palette

```css
:root {
  --pc-background: #FBFBFB;
  --pc-foreground: #272727;
  --pc-muted: #5A5A5A;

  --pc-primary: #E78585;
  --pc-primary-soft: #FFDADA;

  --pc-cream: #FFF0D0;
  --pc-cream-border: #F3E5C5;

  --pc-blue-soft: #D0F3FF;
  --pc-blue-border: #C4DEE8;

  --pc-surface: #F1F1F1;
  --pc-muted-light: #A8A8A8;
  --pc-pink-soft-2: #F2CCCC;
}
```

The template's actual source defines:

```text
Primary background: #FBFBFB
Dark:              #272727
Text:              #272727
Muted text:        #5A5A5A
Accent:            #E78585
Accent soft:       #FFDADA
Cream:             #FFF0D0
Blue soft:         #D0F3FF
Blue border:       #C4DEE8
Surface:           #F1F1F1
Light muted:       #A8A8A8
```

Do not scatter these hex values through components. Define them centrally as theme tokens.

## Fonts

Primary:

```text
Inter
```

Decorative/accent:

```text
Just Another Hand
```

Use Inter for:

- body text
- navigation
- buttons
- tables
- forms
- application UI

Use Just Another Hand sparingly for:

- decorative labels
- playful marketing microcopy
- select hero accents

Do not use the decorative font for dashboard tables or complex application UI.

---

# 9. Typography scale

Use the template's hierarchy as the starting point:

```text
Display / H1    62px / bold
H2              56px / bold
H3              48px / 600
H4              29px / 500
H5              22px / 500
H6              22px / 400 decorative where appropriate
Body            16px / regular
Navigation      18px / regular
```

The responsive implementation may scale these values down on tablet/mobile.

Recommended app-specific additions:

```text
Page title       32–40px
Section title    28–36px
Card title       18–24px
Table text       14–16px
Caption          12–14px
```

Never hardcode different typography sizes randomly per page.

---

# 10. Card system

The template strongly uses rounded cards.

## Service card

Starting point:

```text
background: #F1F1F1
radius: 50px
padding: 30px
transition: 300–500ms
```

Hover:

```text
background: #FFDADA
translateY(-8px to -20px)
```

Use this visual language for:

- service category cards
- grooming cards
- training cards
- veterinary discovery cards
- major dashboard action cards where appropriate

## Product card

Use the same rounded visual language but reduce radius and padding where needed for dense e-commerce grids.

Recommended:

```text
radius: 24–32px
background: #F1F1F1
overflow: hidden
```

## Application cards

For admin/professional UIs, use less exaggerated radius:

```text
radius: 16–24px
```

The management application must remain efficient and readable.

## Important rule

Do not use `rounded-[random-number]` everywhere.

Use semantic card variants.

Example:

```text
Card / default
Card / service
Card / product
Card / dashboard
Card / interactive
Card / danger
Card / success
```

---

# 11. Button system

Primary template-inspired button:

```text
background: #E78585
text: #FBFBFB
pill shape
```

Secondary:

```text
transparent
border: #E78585
text: #E78585
pill shape
```

Use icon + label where useful.

Button sizes:

```text
sm
md
lg
icon
```

Do not create unique button CSS per page.

---

# 12. Global component inventory

Build these before implementing full product pages.

## A. Primitive UI

```text
Button
IconButton
Input
Textarea
Select
Combobox
Checkbox
RadioGroup
Switch
Label
Badge
Avatar
Card
Separator
Tooltip
Popover
DropdownMenu
Tabs
Accordion
Dialog
Drawer
Sheet
AlertDialog
Calendar
DatePicker
TimePicker
Skeleton
Spinner
Toast
Table
Pagination
Breadcrumb
```

## B. Shared application components

```text
PublicHeader
PublicFooter
CustomerTopbar
Sidebar
AdminSidebar
ProfessionalSidebar
Topbar
MobileNav
Breadcrumbs
PageHeader
SectionHeader
StatCard
DataTable
SearchBar
SearchInput
FilterBar
FilterPopover
SortSelect
StatusBadge
EmptyState
LoadingState
ErrorState
ConfirmDialog
FormModal
FormDrawer
NotificationDropdown
UserMenu
```

## C. Domain components

```text
ServiceCard
ProviderCard
VeterinaryCard
GroomingProviderCard
TrainerCard
PetCard
PetProfileSummary
BookingCard
AppointmentCard
ProductCard
CartItem
OrderCard
OrderTimeline
ReviewCard
RatingStars
TimeSlotPicker
AvailabilityEditor
```

---

# 13. Modal-first rules

These must NOT become separate routes unless a later requirement explicitly needs a shareable URL.

Use modal/drawer/dialog for:

```text
Login
Registration
Forgot password steps
Add/Edit Pet
Add vaccination
Add medical record
Add/Edit address
Book appointment
Book grooming
Book training
Add/Edit product
Add/Edit category
Create/Edit user
Verify professional
Create review
Cancel booking
Cancel order
Update order status
Payment state
```

The route should represent a meaningful view, not a form.

---

# 14. Authentication UI architecture

Authentication is a global modal system.

Create:

```text
AuthModalProvider
LoginModal
RegisterModal
ForgotPasswordModal
OtpModal
ResetPasswordModal
```

Suggested state:

```text
closed
login
register
forgot-password
otp
reset-password
success
```

Do not duplicate login forms across pages.

Any protected CTA can open the global authentication modal.

---

# 15. Page/route rules

Use the existing PawConnect page architecture as the product baseline.

### Public

```text
/
 /services
 /services/veterinary
 /services/grooming
 /services/training
 /shop
 /about
 /faq
 /contact
 /404
```

### Customer

```text
/app
/app/pets
/app/pets/[id]
/app/services/veterinary
/app/services/veterinary/[id]
/app/services/grooming
/app/services/grooming/[id]
/app/services/training
/app/services/training/[id]
/app/shop
/app/shop/products
/app/shop/products/[id]
/app/shop/cart
/app/shop/checkout
/app/shop/order-success/[id]
/app/orders
/app/orders/[id]
/app/bookings
/app/bookings/[id]
/app/bookings/appointments/[id]
/app/profile
```

### Admin

```text
/admin
/admin/users
/admin/veterinarians
/admin/service-providers
/admin/bookings
/admin/products
/admin/categories
/admin/orders
/admin/orders/[id]
/admin/reviews
/admin/reports
/admin/audit-logs
/admin/settings
```

### Veterinarian

```text
/vet
/vet/appointments
/vet/appointments/[id]
/vet/availability
/vet/profile
```

### Service Provider

```text
/provider
/provider/bookings
/provider/services
/provider/availability
/provider/profile
```

---

# 16. Business rules that the frontend must respect

## No Vendor

Never create:

```text
Vendor
Vendor Management
Vendor Verification
Vendor Dashboard
Vendor Commission
Vendor Settlement
Vendor Payout
Vendor Product Ownership
```

Never add `vendorId` to product UI unless the product specification explicitly changes.

## Products

Only Admin creates and manages products.

Products are in-house.

Admin controls:

```text
name
category
description
price
stock
images
active/inactive
```

## Bookings

The UI must reflect availability.

Backend must be authoritative for preventing duplicate bookings.

Never assume a slot is available merely because the frontend displayed it earlier.

## Reviews

Allow reviews only for eligible completed/received transactions.

Rating:

```text
1–5
```

Admin can moderate.

## Orders

Order item price must be treated as a snapshot.

Order status:

```text
Confirmed
Packed
Shipped
Delivered
Cancelled
```

## Payments

Current scope uses a test/dummy payment flow.

Represent:

```text
pending
processing
success
failed
```

Do not build a production payment gateway unless the scope changes.

## Audit

Important Admin actions should be represented in the UI as auditable operations.

---

# 17. Loading/error/empty state rule

Every data-driven screen must handle:

```text
loading
success
empty
error
```

Do not create a page that only works with successful API data.

Use shared components:

```text
<PageSkeleton />
<EmptyState />
<ErrorState />
```

Do not create one-off spinners everywhere.

---

# 18. Responsive rules

## Desktop

Public:

```text
Top navigation
Large hero
Multi-column cards
Generous whitespace
```

Customer:

```text
Top application navbar
Responsive grid
```

Admin/professional:

```text
Sidebar
Topbar
Main content
```

## Tablet

```text
Collapsed navigation
2-column grids where appropriate
Collapsible sidebar
```

## Mobile

```text
Hamburger/drawer navigation
Stacked cards
Full-width controls
Full-height complex dialogs
Mobile-friendly tables
Bottom-friendly primary actions
```

Do not simply shrink desktop components.

---

# 19. Accessibility rules

Every interactive component must have:

```text
keyboard support
visible focus state
semantic HTML
aria labels where needed
proper form labels
meaningful error messages
alt text for content images
```

Never use an icon-only button without an accessible label.

---

# 20. Image and template rules

The Petopia template is a visual reference.

Reuse concepts such as:

```text
hero compositions
rounded service cards
top navigation
typography hierarchy
CTA sections
testimonial cards
FAQ accordion
footer
pill controls
```

Do NOT copy the template's unrelated business features into PawConnect.

Specifically avoid bringing over:

```text
pricing plans
generic team pages
generic marketplace/vendor concepts
generic appointment logic
blog CMS
```

unless the project scope explicitly adds them.

---

# 21. Component layering rule

The dependency direction should be:

```text
UI primitives
↓
Shared components
↓
Domain components
↓
Page sections
↓
Routes
```

A primitive must not import a domain component.

A generic component must not know PawConnect business rules.

Bad:

```text
Button → Product logic
Card → Booking API
Dialog → Vendor state
```

Good:

```text
ProductCard → Button
BookingModal → Dialog + Form fields
```

---

# 22. Naming rules

Use PascalCase for components:

```text
ProductCard.tsx
BookingModal.tsx
AdminSidebar.tsx
```

Use camelCase for functions/variables:

```text
getProducts
handleSubmit
selectedPet
```

Use kebab-case for URL segments:

```text
service-providers
audit-logs
```

Use singular nouns for dynamic IDs:

```text
[id]
```

---

# 23. No duplicate-component rule

Before creating a component, search:

```text
src/components/
```

If something already exists, reuse or extend it.

Do not create:

```text
ProductCard
ProductCard2
ProductItemCard
ShopProductCard
NewProductCard
```

without a documented reason.

Prefer variants:

```text
<ProductCard variant="grid" />
<ProductCard variant="compact" />
```

---

# 24. No hardcoded business data in production components

Temporary mock data must live in:

```text
src/lib/mock/
```

or explicit fixture files.

Do not bury long mock arrays inside pages.

---

# 25. API/UI separation

Route/page components should orchestrate.

They should not contain huge request functions, validation schemas, formatting logic, and complicated UI all in one file.

Prefer:

```text
page.tsx
↓
feature component
↓
query hook
↓
API client
```

---

# 26. Recommended hooks

Create domain hooks such as:

```text
useAuth
usePets
usePet
useVeterinarians
useVeterinarian
useProviders
useServices
useProducts
useCart
useBookings
useOrders
useReviews
useNotifications
```

Hooks should wrap API/cache behavior.

Do not duplicate query configuration across pages.

---

# 27. Global providers

Create a single:

```text
src/providers/AppProviders.tsx
```

Responsible for global providers such as:

```text
QueryClientProvider
Toaster
Auth UI provider
Theme/design-system context only when genuinely needed
```

Do not nest dozens of providers independently in every route.

---

# 28. Build order

## Phase 0 — Project bootstrap

Complete:

```text
Next.js
TypeScript
ESLint
Tailwind
shadcn/ui
Lucide
TanStack Query
Zustand
React Hook Form
Zod
Sonner
```

Verify:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Phase 1 — Design system

Build ONLY:

```text
tokens
typography
buttons
inputs
cards
dialogs
drawers
tables
badges
tabs
accordion
date/time controls
loading states
empty states
error states
```

Also create:

```text
PublicHeader
PublicFooter
CustomerTopbar
AdminSidebar
ProfessionalSidebar
Topbar
PageHeader
SectionHeader
```

Do not build full business pages yet.

## Phase 2 — Shell verification

Create a temporary component showcase route:

```text
/design-system
```

Use it only during development.

Show:

```text
colors
typography
buttons
cards
forms
dialogs
tables
badges
states
navigation
```

Delete or protect this route before production if not required.

## Phase 3 — Public website

Build:

```text
Home
Services
Veterinary
Grooming
Training
Shop
About
FAQ
Contact
```

## Phase 4 — Customer application

Build:

```text
Dashboard
Pets
Pet details
Veterinary flow
Grooming flow
Training flow
Bookings
Profile
```

## Phase 5 — E-commerce

Build:

```text
Shop home
Product listing
Product details
Cart
Checkout
Payment state
Order success
Orders
Order details
```

## Phase 6 — Professional portals

Build:

```text
Vet dashboard
Appointments
Availability
Profile

Provider dashboard
Bookings
Services
Availability
Profile
```

## Phase 7 — Admin

Build:

```text
Dashboard
Users
Veterinarians
Service Providers
Bookings
Products
Categories
Orders
Reviews
Reports
Audit Logs
Settings
```

## Phase 8 — QA

Verify:

```text
responsive behavior
modal behavior
form validation
role-based route protection
booking conflicts
cart quantity behavior
order lifecycle
payment states
loading states
empty states
error states
accessibility
```

---

# 29. Definition of done for every page

A page is not complete just because it visually renders.

Every completed route must have:

```text
correct route
correct layout
responsive behavior
loading state
empty state where applicable
error state where applicable
form validation where applicable
accessibility basics
reused global components
no duplicated styles
no hardcoded theme colors
no broken TypeScript
no lint errors
```

Run:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

before declaring a phase complete.

---

# 30. Agent workflow

Every coding-agent task should follow:

```text
1. Read AGENTS.md
2. Read the relevant docs
3. Inspect existing components
4. Check whether the requested component already exists
5. Plan the smallest reusable implementation
6. Implement
7. Reuse tokens/components
8. Verify TypeScript
9. Run lint
10. Run focused tests/build
11. Summarize changed files and verification
```

The agent must not jump directly into page-specific markup if a missing reusable component should be built first.

---

# 31. First OpenCode prompt for this project

Paste this after the project is created:

```text
Read AGENTS.md and docs/PAWCONNECT_PROJECT_BLUEPRINT.md completely.

Do NOT build the PawConnect business pages yet.

First build the reusable global design system and application shells.

Tasks:

1. Inspect the current Next.js project.
2. Configure the Petopia-derived design tokens in the global theme.
3. Configure Inter as the primary font and Just Another Hand as the decorative font.
4. Create the shared UI primitives using shadcn/ui and Lucide.
5. Create semantic variants for buttons, cards, badges and inputs.
6. Build the public header/footer.
7. Build the customer top navigation.
8. Build the admin sidebar/topbar.
9. Build the professional sidebar/topbar.
10. Build PageHeader, SectionHeader, DataTable, SearchBar, FilterBar, StatusBadge, EmptyState, LoadingState, ErrorState, ConfirmDialog, FormModal and FormDrawer.
11. Build the global authentication modal system shell.
12. Build the global provider setup.
13. Create a temporary /design-system showcase route to verify every component.
14. Do not implement domain API calls yet.
15. Do not create Vendor-related components or routes.
16. Do not create separate CRUD form pages.
17. Reuse the existing components instead of creating duplicates.

At the end:
- run pnpm lint
- run pnpm typecheck
- run pnpm build
- report changed files
- report any unresolved issues
```

---

# 32. Important implementation decision

Do not try to reproduce the original HTML template by copying its Bootstrap/HTML structure into Next.js.

Instead:

```text
Petopia template
   ↓
visual language
   ↓
PawConnect design tokens
   ↓
React/shadcn reusable components
   ↓
PawConnect pages
```

This keeps the UI visually consistent while allowing the application architecture to remain maintainable.

---

# 33. Current project scope baseline

Use these numbers for planning:

```text
Actual routes/pages: approximately 55–60
Modal/drawer/dialog states: approximately 30–40
Database tables: approximately 28
Active roles:
  Pet Owner
  Veterinarian
  Service Provider
  Admin

Vendor roles: 0
Vendor marketplace tables: 0
Marketplace: in-house products only
```

This is the frontend baseline. Backend/API details should be mapped separately rather than invented inside UI components.

---

# 34. Absolute agent prohibitions

Never:

- create a Vendor feature
- create a Vendor role
- create vendor fields in products
- add separate login/register pages
- add CRUD pages when a modal/drawer is sufficient
- copy the template's unrelated feature architecture
- hardcode colors in random components
- duplicate existing shared components
- put API calls in every page
- use Zustand as a server-state database
- make everything `"use client"`
- bypass validation
- mark a page complete without loading/error/empty handling
- ignore mobile layout
- introduce a new library when the existing stack already solves the problem

