# DGC Chakshu — Design System & Brand Guidelines

> **Follow this guide strictly across all UI elements, frontend components, and designs.**

---

## 🎨 Color Palette

All UI elements must use these exact colors. No deviations.

### Primary Colors

| Color Name | Hex | RGB | Usage |
|---|---|---|---|
| **Primary Dark** | `#123B5D` | `18, 59, 93` | Page backgrounds, primary text, main headings |
| **Primary Blue** | `#1F6FAE` | `31, 111, 174` | Buttons, links, section headings, highlights |
| **Accent Teal** | `#0E8F87` | `14, 143, 135` | Accents, icons, hover states |

### Secondary Colors

| Color Name | Hex | RGB | Usage |
|---|---|---|---|
| **Background Light** | `#F6F9FB` | `246, 249, 251` | Page background, card backgrounds |
| **Surface White** | `#FFFFFF` | `255, 255, 255` | Cards, modals, inputs |
| **Text Dark** | `#243447` | `36, 52, 71` | Main body text, labels |
| **Text Muted** | `#667085` | `102, 112, 133` | Secondary text, hints, captions |
| **Border Light** | `#E2E8F0` | `226, 232, 240` | Card borders, dividers, input borders |

### Do NOT use
- Red, orange, yellow (reserved for errors/warnings in future)
- Custom colors without approval from Project Lead

---

## 📝 Typography

**Font Family:** System UI (system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif)

### Heading Sizes

| Level | Size | Weight | Color | Usage |
|---|---|---|---|---|
| **H1** | 40px | Bold (700) | Primary Dark | Page titles, main headers |
| **H2** | 28px | Bold (700) | Primary Dark | Section headings |
| **H3** | 20px | Semi-bold (600) | Primary Blue | Sub-headings, card titles |
| **H4** | 18px | Semi-bold (600) | Text Dark | Minor headings |

### Body Text

| Type | Size | Weight | Color | Line-height |
|---|---|---|---|---|
| **Body Large** | 16px | Regular (400) | Text Dark | 1.5 |
| **Body Regular** | 14px | Regular (400) | Text Dark | 1.5 |
| **Body Small** | 12px | Regular (400) | Text Muted | 1.5 |
| **Caption** | 12px | Regular (400) | Text Muted | 1.4 |

---

## 🧩 Components & Styles

### Buttons

#### Primary Button
- **Background:** Primary Blue (`#1F6FAE`)
- **Text Color:** White (`#FFFFFF`)
- **Padding:** 12px vertical, 16px horizontal
- **Border Radius:** 6px
- **Font Size:** 14px, Semi-bold
- **Hover State:** Darken background by 15%, add subtle shadow
- **Active State:** Darken background by 25%

#### Secondary Button
- **Background:** Transparent
- **Border:** 1px solid Primary Blue (`#1F6FAE`)
- **Text Color:** Primary Blue (`#1F6FAE`)
- **Padding:** 12px vertical, 16px horizontal
- **Border Radius:** 6px
- **Font Size:** 14px, Semi-bold
- **Hover State:** Light background fill

### Cards

- **Background:** White (`#FFFFFF`)
- **Border:** 1px solid Border Light (`#E2E8F0`)
- **Border Radius:** 10px
- **Padding:** 16px
- **Shadow:** Subtle (0 2px 8px)
- **Hover State:** Shadow increases, slight upward lift

### Input Fields

- **Background:** White (`#FFFFFF`)
- **Border:** 1px solid Border Light (`#E2E8F0`)
- **Border Radius:** 6px
- **Padding:** 10px 12px
- **Font Size:** 14px
- **Focus State:** Border color changes to Primary Blue (`#1F6FAE`)

### Search Bar

- **Height:** 44px (mobile friendly)
- **Border Radius:** 8px
- **Padding:** 8px 12px
- **Font Size:** 14px
- **Background:** White
- **Button Color:** Primary Blue

### Navbar

- **Background:** Primary Dark (`#123B5D`)
- **Height:** 56px (mobile), 64px (desktop)
- **Text Color:** White (`#FFFFFF`)
- **Padding:** 12px 16px (mobile), 16px 24px (desktop)
- **Logo Font Size:** 20px, Bold
- **Links Font Size:** 14px

---

## 📐 Spacing Rules (8px Grid System)

All spacing must be in multiples of 8px for consistency.

```
xs:  4px
sm:  8px
md:  16px
lg:  24px
xl:  32px
2xl: 48px
```

### Common Spacing Usage

| Element | Spacing |
|---|---|
| Between cards | 16px (md) |
| Inside cards (padding) | 16px (md) |
| Between sections | 32px (lg) |
| Button padding (vertical) | 12px |
| Button padding (horizontal) | 16px (md) |
| Input padding | 10px |
| Navbar height | 56px (mobile), 64px (desktop) |
| Page margins | 16px (mobile), 24px (tablet), 32px (desktop) |

---

## 📱 Responsive Design Breakpoints

Mobile-first approach. Build for phone first, scale up.

| Device | Width | Usage |
|---|---|---|
| **Mobile** | < 768px | Single column, full width cards |
| **Tablet** | 768px - 1024px | Two columns, adjusted spacing |
| **Desktop** | > 1024px | Three+ columns, larger spacing |

### Grid Layout
- Mobile: 1 column cards
- Tablet: 2 columns cards with 20px gap
- Desktop: 3 columns cards with 24px gap

---

## 🎯 Logo & Branding

### Logo Usage
- Logo must always be on transparent or light background
- Minimum size: 48px (mobile), 64px (desktop)
- Do NOT rotate, skew, or change colors of logo
- Clear space around logo: At least 16px on all sides
- Never place on Primary Dark background without testing contrast

---

## ✅ Implementation Checklist

Before marking a feature as complete:

- [ ] All colors match the palette exactly (use color picker to verify)
- [ ] Headings use correct sizes (H1: 40px, H2: 28px, etc.)
- [ ] All buttons match button styles (primary/secondary)
- [ ] Card spacing and shadows are correct
- [ ] Input fields have proper focus states
- [ ] Spacing follows 8px grid system
- [ ] Mobile-first responsive design tested
- [ ] No hardcoded colors — use CSS variables or design tokens
- [ ] System fonts only — no custom font files
- [ ] Navbar height correct (56px mobile, 64px desktop)

---

## 🚨 Common Mistakes (Don't do these!)

❌ Using custom colors without approval  
❌ Hardcoding colors in components  
❌ Mixing heading sizes or weights  
❌ Adding shadows that don't match spec  
❌ Forgetting 8px grid spacing  
❌ Testing only on desktop, not mobile  
❌ Using web fonts (stick to system fonts)  
❌ Changing logo colors or proportions  
❌ Inconsistent button styles across app  
❌ Cards with wrong padding or border radius  

---

## 📋 Design Tokens Reference

Keep these values handy when building:

**Colors:** Primary Dark #123B5D, Primary Blue #1F6FAE, Accent Teal #0E8F87  
**Spacing:** 4px, 8px, 16px, 24px, 32px, 48px  
**Heading Sizes:** 40px (H1), 28px (H2), 20px (H3), 18px (H4)  
**Body Text:** 16px (large), 14px (regular), 12px (small)  
**Border Radius:** 6px (inputs), 8px (search), 10px (cards)  
**Button Padding:** 12px vertical, 16px horizontal  
**Navbar Height:** 56px (mobile), 64px (desktop)  

---

## 📞 Questions?

If you need to add a color, font size, or component style:
1. Propose it in the group with a screenshot or mockup
2. Get approval from Project Lead & Design Lead
3. Add it to this document
4. Update all existing components if needed

**Everyone follows this document. No exceptions.**

---

**DGC Chakshu Design System v1.0**  
Last Updated: August 2026  
Maintained by: Design & Frontend Team
