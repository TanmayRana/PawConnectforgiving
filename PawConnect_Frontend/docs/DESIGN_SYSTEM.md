# PawConnect Design System

This document is the single visual reference for PawConnect frontend work.

## Reference

The Petopia template is a visual reference only. Preserve its visual language while rebuilding the implementation in React/Next.js.

## Tokens

```text
background     #FBFBFB
foreground     #272727
muted          #5A5A5A
primary        #E78585
primary-soft   #FFDADA
cream          #FFF0D0
cream-border   #F3E5C5
blue-soft      #D0F3FF
blue-border    #C4DEE8
surface        #F1F1F1
muted-light    #A8A8A8
pink-soft      #F2CCCC
```

## Fonts

Inter:
- body
- navigation
- form labels
- admin/professional UI

Just Another Hand:
- decorative headings
- small marketing accents
- playful hero labels

## Typography

Desktop starting scale:

```text
H1 62px / 700
H2 56px / 700
H3 48px / 600
H4 29px / 500
H5 22px / 500
Body 16px / 400
Navigation 18px / 400
```

Application pages can use a tighter scale:

```text
Page title 32–40
Section 28–36
Card title 18–24
Table 14–16
Caption 12–14
```

## Cards

Public/discovery:

```text
radius 40–50px
padding about 30px
surface #F1F1F1
hover #FFDADA
subtle lift on hover
```

Product:

```text
radius 24–32px
overflow hidden
image-first composition
```

Admin/professional:

```text
radius 16–24px
less decorative
high information density
```

## Buttons

Primary:
```text
#E78585
#FBFBFB
pill shape
```

Secondary:
```text
transparent
1px #E78585 border
#E78585 text
pill shape
```

Use consistent variants instead of one-off page CSS.

## Spacing

Prefer a small semantic spacing scale.

Do not invent random spacing values.

Public sections should feel spacious.

Admin/professional screens should prioritize readability and density.

## Motion

Use restrained transitions.

Good:
- card hover lift
- opacity/fade
- modal enter/exit
- dropdown motion

Avoid:
- excessive parallax
- constant animation
- distracting motion in admin tables/forms

Honor reduced-motion preferences.
