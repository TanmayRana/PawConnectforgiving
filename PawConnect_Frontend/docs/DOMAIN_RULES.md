# PawConnect Domain Rules

## Roles

Active roles:
- Pet Owner
- Veterinarian
- Service Provider
- Admin

Vendor role is removed.

## Products

Products are owned and managed by PawConnect.

Admin:
- creates products
- edits products
- controls stock
- manages product images
- manages active/inactive state

Never create vendor ownership.

## Veterinary

Available slots are derived from veterinarian availability.

Double booking must be prevented server-side.

## Grooming / Training

Provider availability controls bookable slots.

Booking status is tracked.

## Reviews

Reviews:
- are linked to eligible completed service or received product
- use 1–5 rating
- can be moderated by Admin

## Orders

Order item stores:
- product reference
- quantity
- price snapshot
- line total

Lifecycle:

```text
Confirmed
Packed
Shipped
Delivered
Cancelled
```

## Payments

Current scope:
- test/dummy payment
- success/failure state stored

Do not integrate production payment gateway without scope approval.

## Audit

Important Admin actions should be recorded in audit logs.

## Scope exclusions

Unless explicitly added later, do not build:
- external marketplace
- seller onboarding
- vendor commission
- vendor payouts
- warehouse management
- delivery rider app
- live GPS tracking
- chat system
- subscriptions
- blog CMS
- advanced loyalty
- AI recommendations
