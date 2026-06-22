# Yim Digital Store - Premium Homepage Design Plan

> **For Claude/Agent:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> Skills applied: `@high-end-visual-design`, `@design-taste-frontend`, `@writing-plans`.

**Goal:** Redesign the currently blank/generic homepage into an agency-level premium digital storefront using the "Soft Structuralism" aesthetic, "Double-Bezel" product cards, premium typography, and fluid microinteractions.

**Architecture:** We will use Next.js App Router with Tailwind CSS v4. We will introduce `framer-motion` for fluid dynamics and scroll interpolation, and `@phosphor-icons/react` for ultra-light premium icons (avoiding the banned generic icons). The Hero section will feature an Asymmetrical layout with massive typography, and the products will be displayed using a high-end Nested Architecture approach.

**Tech Stack:** Next.js (React 19), Tailwind CSS v4, Framer Motion, Phosphor Icons, next/font/google (Outfit).

## Proposed Changes

---

### Task 1: Setup Dependencies & Typography

**Files:**
- Modify: `package.json`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Step 1: Install Libraries**
Run: `npm install framer-motion @phosphor-icons/react`

**Step 2: Update Typography and Base Layout**
Modify `layout.tsx` to inject the `Outfit` font from `next/font/google`. Wrap the children in a structure that supports a global grain/noise overlay (`pointer-events-none`) for a premium texture.

**Step 3: Update CSS Variables**
Modify `globals.css` to set the Soft Structuralism palette. Remove default Arial fonts and harsh black colors.

---

### Task 2: Build Premium UI Primitives

**Files:**
- Create: `src/components/ui/ProductCard.tsx`
- Create: `src/components/ui/HeroSection.tsx`

**Step 1: Build the "Double-Bezel" Product Card**
Create a Client Component for the product card featuring nested enclosures:
- Outer shell with hairline border and large radius (`rounded-[2rem]`).
- Inner core with its own distinct background and concentric smaller radius.
- Implement magnetic hover physics (`active:scale-[0.98]`) and a "Button-in-Button" trailing icon for the CTA.

**Step 2: Build the Hero Section**
Create an asymmetrical Hero component with massive typography and staggered mask reveals for the heading text (using Framer Motion).

---

### Task 3: Rewrite Homepage Layout

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Integrate Components and Preserve Data Fetching**
- **CRITICAL DATA PRESERVATION:** `page.tsx` MUST remain an async Server Component. You MUST PRESERVE the existing Supabase query fetching `products` with the `is_archived = false` filter.
- Pass the fetched products payload as props down to the new `ProductCard` Client Components.
- Replace the generic grid in `page.tsx` with the new `HeroSection` and a stagger-animated grid of `ProductCard`s using Framer Motion's `layout` properties for smooth entry.
- Ensure the mobile view aggressively falls back to a single column (`w-full px-4`) to prevent horizontal scrolling on mobile viewports.

## Verification Plan

### Automated Tests
- None required for UI layer at this step.

### Manual Verification
- Start the development server with `npm run dev`.
- Verify the `Outfit` font is loaded correctly.
- Ensure the Hero section displays with the staggered text reveal on mount.
- Hover and click on product cards to verify the "Double-Bezel" magnetic scale-down physics.
- Resize window to `<768px` to ensure the layout collapses to a single column cleanly.
