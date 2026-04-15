# Design System Specification: High-End Editorial for B2B Billing

## 1. Overview & Creative North Star: "The Kinetic Ledger"
In the world of B2B billing, "clean" is often a synonym for "empty." This design system rejects that emptiness. Our North Star is **The Kinetic Ledger**—a concept that treats financial data not as static rows in a spreadsheet, but as a living, breathing editorial experience. 

We move beyond the "SaaS-in-a-box" look by utilizing intentional asymmetry, high-contrast typographic scales, and layered tonal depth. The goal is to make the user feel like they are navigating a premium financial journal where every invoice, line item, and metric has the weight and precision of a high-end publication.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the energy of "Spotify Green" (#1DB954) but refined through a sophisticated hierarchy of neutrals to ensure the B2B context feels authoritative, not just trendy.

### The "No-Line" Rule
**Borders are a design debt.** In this system, 1px solid borders for sectioning are strictly prohibited. Boundaries must be defined solely through background color shifts or subtle tonal transitions.
- Use `surface_container_low` (#f3f4f5) for large layout sections.
- Use `surface_container_lowest` (#ffffff) for active workspace areas.
- This creates a "sculpted" look where the UI feels carved from a single block rather than assembled from wireframes.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine vellum.
- **Level 0 (Background):** `surface` (#f8f9fa).
- **Level 1 (Sections):** `surface_container` (#edeeef).
- **Level 2 (Interactive Cards):** `surface_container_lowest` (#ffffff).
- **Level 3 (Popovers/Modals):** Glassmorphism using `surface_container_low` at 80% opacity with a `20px` backdrop blur.

### Signature Textures
To add "soul," use subtle linear gradients for primary actions:
- **Primary CTA:** Gradient from `primary` (#006e2d) to `primary_container` (#1db954) at a 135-degree angle. This prevents the vibrant green from feeling "flat" or "cheap."

---

## 3. Typography: Editorial Precision
We use **Manrope** for its geometric balance. It bridges the gap between the friendliness of a consumer app and the rigidity of a financial tool.

*   **Display (The Statement):** `display-lg` (3.5rem). Use sparingly for "Total Revenue" or "Outstanding Balance" metrics. This is your "Hero" moment.
*   **Headline (The Context):** `headline-sm` (1.5rem). Used for page titles. Pair with `label-md` uppercase to create an editorial sub-header effect.
*   **Body (The Workhorse):** `body-lg` (1rem). Primary reading weight. Ensure line height is set to 1.6 for maximum readability in complex invoices.
*   **Label (The Metadata):** `label-sm` (0.6875rem). Use `on_surface_variant` (#3d4a3d) to keep these secondary but legible.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often messy. We achieve depth through **Ambient Light** and **Tonal Stacking**.

### The Layering Principle
Instead of a shadow, place a `surface_container_lowest` card on a `surface_container` background. The slight shift in hex value provides a cleaner, more "modernist" lift than a shadow ever could.

### Ambient Shadows
When a floating effect is mandatory (e.g., a dropdown or a primary modal):
- **Shadow Token:** `0px 12px 32px rgba(25, 28, 29, 0.06)`. 
- The color is a tinted version of `on_surface`, creating an "ambient" feel rather than a gray smudge.

### The "Ghost Border" Fallback
If a container sits on a background of the same color, use a **Ghost Border**:
- `outline_variant` (#bccbb9) at **15% opacity**. It should be felt, not seen.

---

## 5. Components: The Billing Toolkit

### Buttons: The Kinetic Trigger
- **Primary:** Gradient (`primary` to `primary_container`), `12px` (md) corners. High contrast `on_primary` text.
- **Secondary:** Surface-only. `surface_container_high` with `primary` text. No border.
- **Interaction:** On hover, the button should lift slightly using an Ambient Shadow and scale to 102%.

### Input Fields: Minimalist Clarity
- **Style:** No bottom line, no full border. Use a `surface_container_highest` background with a `12px` radius.
- **Focus:** Transition the background to `surface_container_lowest` and add a 1px `primary` ghost border (20% opacity).

### Cards & Lists: The No-Divider Rule
- **Standard:** Invoices and line items must not use divider lines. 
- **Separation:** Use `16px` of vertical white space or alternate row colors using `surface` and `surface_container_low`. 
- **Header:** Use `title-sm` in `secondary` (#645d5c) for column headers, strictly all-caps with 0.05em letter spacing.

### Key Performance Indicators (KPIs)
- Custom component: A `surface_container_lowest` card with a `4px` vertical accent bar of `primary` green on the left side to denote "Active" or "Positive" status.

---

## 6. Do’s and Don’ts

### Do
- **Do** use asymmetrical margins. Give the right-hand side of the page 20% more "breathing room" than the left for a modern, editorial feel.
- **Do** use `primary_fixed_dim` for "Success" states to keep the palette cohesive.
- **Do** leverage whitespace as a functional tool to group related financial data.

### Don’t
- **Don't** use 100% black (#000000). Always use `on_secondary_fixed` (#201a1a) for the deepest text to maintain the "off-white and charcoal" sophistication.
- **Don't** use "Alert Red" for everything. Use `tertiary` (#a8353e) for a more "muted-premium" error state that doesn't cause user panic.
- **Don't** use standard `0.5rem` (DEFAULT) rounding for everything. Use `1.5rem` (xl) for main containers to emphasize the "friendly/energetic" brand personality.