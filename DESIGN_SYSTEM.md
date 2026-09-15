# MedAgenda Design System & Language Specification

> **Single Source of Truth for Multi-Agent Mobile & Web Development**  
> *Repository:* `Frontend-MedAgenda` (`medagenda`)  
> *Purpose:* This document defines the exact design system, tokens, color palette, typography, spacing, and component guidelines for MedAgenda. All AI agents working on mobile app features or web interfaces must strictly adhere to this specification.

---

## 1. Core Design Tokens

### 1.1 Brand & Core Colors
* **Primary (Teal / Turquoise):** `#259487` (Primary buttons, active tabs, main branding accents)
* **Secondary / Hover Accent (Steel Blue):** `#4682B4` (Hover states, secondary highlights)

### 1.2 Neutral Palette
* **Background:** `#ffffff` (Pure white)
* **Surface:** `#f9fafb` (`gray-50`)
* **Surface Muted:** `#f3f4f6` (`gray-100`)
* **Border:** `#d1d5db` (`gray-300`)
* **Border Light:** `#e5e7eb` (`gray-200`)
* **Text Main:** `#171717`
* **Text Muted:** `#4b5563` (`gray-600`)
* **Text Light:** `#9ca3af` (`gray-400`)

### 1.3 Semantic & Feedback Colors
* **Success:** BG `#ecfdf5`, Border `#a7f3d0`, Text `#065f46`, Badge BG `#d1fae5`, Badge Text `#047857`
* **Error / Danger:** BG `#fef2f2`, Border `#fecaca`, Text `#991b1b`, Badge BG `#fee2e2`, Badge Text `#b91c1c`
* **Warning:** BG `#fffbeb`, Border `#fde68a`, Text `#92400e`, Badge BG `#fef3c7`, Badge Text `#b45309`
* **Info / Primary Tint:** BG `#eff6ff`, Border `#bfdbfe`, Text `#1e40af`, Badge BG `#dbeafe`, Badge Text `#1d4ed8`
* **Badges:** Cyan (BG `#cffafe`, Text `#0e7490`), Purple (BG `#f3e8ff`, Text `#7e22ce`)

### 1.4 Typography & Spacing
* **Font Family:** `Arial, Helvetica, sans-serif`
* **Font Sizes:** `xs` (12px), `sm` (14px), `base` (16px), `lg` (18px), `xl` (20px), `2xl` (24px)
* **Font Weights:** Normal (`400`), Medium (`500`), Semibold (`600`), Bold (`700`)
* **Spacing Scale (4px Multiples):** 4px (`0.25rem`), 8px (`0.5rem`), 12px (`0.75rem`), 16px (`1rem`), 24px (`1.5rem`), 32px (`2rem`)
* **Border Radius:** `sm` (4px), `md` (6px), `lg` (8px), Full (9999px for pills/badges)
* **Shadows:** `shadow-sm` (`0 1px 2px 0 rgba(0, 0, 0, 0.05)`), `shadow-md` (`0 4px 6px -1px rgba(0, 0, 0, 0.1)`)

---

## 2. CSS Variables & Utility Classes

```css
:root {
  --medagenda-primary: #259487;
  --medagenda-primary-hover: #4682B4;
  --medagenda-bg: #ffffff;
  --medagenda-surface: #f9fafb;
  --medagenda-surface-muted: #f3f4f6;
  --medagenda-border: #d1d5db;
  --medagenda-border-light: #e5e7eb;
  --medagenda-text-main: #171717;
  --medagenda-text-muted: #4b5563;
  --medagenda-text-light: #9ca3af;
}

body {
  background-color: var(--medagenda-bg);
  color: var(--medagenda-text-main);
  font-family: Arial, Helvetica, sans-serif;
}

.medagenda-btn-primary {
  background-color: var(--medagenda-primary);
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}
.medagenda-btn-primary:hover:not(:disabled) {
  background-color: var(--medagenda-primary-hover);
}
.medagenda-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.medagenda-input {
  border: 1px solid var(--medagenda-border);
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--medagenda-text-main);
  background-color: var(--medagenda-bg);
  outline: none;
  width: 100%;
}
.medagenda-input:focus {
  border-color: var(--medagenda-text-main);
}

.medagenda-card {
  background-color: var(--medagenda-bg);
  border: 1px solid var(--medagenda-border-light);
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.medagenda-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 9999px;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}
```

---

## 3. Component Specifications

* **Buttons:** Primary buttons use `#259487` transitioning to `#4682B4` on hover. Disabled/loading state opacity `0.5` with `not-allowed` cursor.
* **Form Inputs & Labels:** Labels are 14px medium (`#4b5563`). Inputs have 1px gray border (`#d1d5db`), 6px radius, focusing to `#171717` border.
* **Cards:** White background with 1px light border (`#e5e7eb`), 8px radius (`lg`), and subtle shadow.
* **Badges:** Pill-shaped (`rounded-full`), `font-semibold`, 12px font size with semantic color tints.
* **Alerts:** Flex row with semantic icon, soft pastel background, matching border and dark text.

---

## 4. Multi-Agent Guidelines
1. **Never hardcode unapproved hex colors.** Use the tokens specified above.
2. **Adhere to the 4px spacing scale.**
3. **Ensure interactive feedback** (hover/active states, loading indicators, disabled opacity).
4. **Platform consistency:** Map these tokens directly to React Native / Flutter styles when developing mobile screens.
