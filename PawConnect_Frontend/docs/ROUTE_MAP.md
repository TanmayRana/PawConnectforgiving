# PawConnect Route Map

## Public

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

## Customer

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

## Admin

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

## Veterinarian

```text
/vet
/vet/appointments
/vet/appointments/[id]
/vet/availability
/vet/profile
```

## Service Provider

```text
/provider
/provider/bookings
/provider/services
/provider/availability
/provider/profile
```

## Forms that should not be routes

Login, register, forgot password, CRUD forms, booking forms, review forms, address forms and simple confirmation/payment states should normally be dialogs, drawers, sheets or inline flows.
