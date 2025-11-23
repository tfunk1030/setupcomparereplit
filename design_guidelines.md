# SetupComparer Design Guidelines

## Design Approach
**Selected System**: Hybrid approach drawing from Linear (clean technical interfaces) + Stripe Dashboard (data clarity) + Carbon Design System (data-heavy applications)

**Key Principles**:
- Technical precision with visual clarity
- Racing-inspired professionalism without gimmicks
- Information density balanced with breathing room
- Scan-friendly data presentation

## Typography

**Font Stack**: Inter (primary), JetBrains Mono (technical values)
- Headings: Inter 600-700, sizes: 2xl (32px), xl (24px), lg (20px)
- Body: Inter 400-500, base (16px) and sm (14px)
- Technical Data/Numbers: JetBrains Mono 500, sm (14px) - for setup values, deltas
- Labels: Inter 500, xs (12px) uppercase with letter-spacing

## Layout System

**Spacing Units**: Tailwind scale focused on 2, 4, 6, 8, 12, 16, 20
- Component padding: p-4 to p-6 for cards
- Section spacing: py-8 to py-12
- Element gaps: gap-4 for grids, gap-2 for tight groupings
- Margins: mb-6 to mb-8 for section separation

**Container Strategy**:
- Dashboard: max-w-7xl for main content area
- Comparison View: Full width with constrained inner containers (max-w-6xl for parameters)
- Forms/Upload: max-w-2xl centered

## Core Layout Structure

### Dashboard Page
- Header: Full-width with navigation, user profile (h-16)
- Main Grid: 3-column grid (grid-cols-3) for statistics cards showing total comparisons, recent activity, favorite setups
- Comparison History: Single-column list with search/filter bar, each item shows setup names, car, track, date with quick actions (view, share, delete)
- Floating Action Button: "New Comparison" prominently placed (bottom-right on desktop, top of page on mobile)

### Upload Flow
- Two-column layout (grid-cols-2) for side-by-side file upload zones
- Large drag-and-drop areas (min-h-64) with dashed borders
- File name display after upload with file size and validation status
- Preview panels showing parsed parameter counts
- Bottom action bar with "Compare" button (sticky on mobile)

### Comparison View (Most Critical)
**Layout**: Three-panel horizontal split
1. **Left Panel** (w-1/3): Setup A parameters in organized accordion groups (Suspension, Aero, Tires, Dampers, ARB)
2. **Center Panel** (w-1/3): Setup B parameters mirroring left structure
3. **Right Panel** (w-1/3): Delta column and interpretation insights

**Parameter Display Pattern**:
- Group headers: Collapsible sections with count badges
- Parameter rows: Grid with 4 columns - Label | Value A | Value B | Delta
- Delta visualization: Numeric value + directional indicator (arrows)
- Magnitude highlighting: Border-left thickness variations (border-l-2 for minor, border-l-4 for major changes)

### Interpretation Panel
- Sticky sidebar or expandable bottom sheet on mobile
- Card-based insights grouped by system (e.g., "Aerodynamics Impact", "Handling Balance")
- Each insight: Icon + bold summary + detailed explanation paragraph
- Visual connection: Hover on insight highlights related parameters in comparison view

## Component Library

### Cards
- Standard card: rounded-lg with shadow-sm, p-6
- Comparison card: Tighter padding (p-4), border treatment for change magnitude
- Stat cards: Centered content, larger numbers (text-3xl), descriptive labels below

### Data Tables
- Striped rows for readability (alternate subtle background)
- Fixed headers on scroll for long parameter lists
- Monospace font for all numeric values with right-alignment
- Column widths: Label (40%), Value A (20%), Value B (20%), Delta (20%)

### Upload Zones
- Dashed border (border-2 border-dashed) in neutral state
- Solid border transition on hover/drag-over
- Icon + primary text + secondary help text stacked vertically
- File preview: Compact horizontal layout with icon, name, size, remove button

### Buttons
**Hierarchy**:
- Primary (CTA): Solid fill, rounded-md, px-6 py-3, font-medium
- Secondary: Outlined, same padding
- Ghost: Text only with hover background, px-4 py-2
- Icon buttons: Square (w-10 h-10), rounded-md, centered icon

### Navigation
- Top navigation bar: Horizontal flex with logo left, menu center, user actions right
- Tab navigation for comparison sections: Underline indicator for active tab
- Breadcrumbs for nested views: Separated by chevrons, last item bold

### Badges & Indicators
- Change magnitude badges: Pill-shaped (rounded-full), px-3 py-1, uppercase text-xs
- Status indicators: Small circles (w-2 h-2) with semantic states
- Parameter count badges: Circular with numeric value

### Forms
- Input fields: border rounded-md, px-4 py-2.5, focus ring treatment
- Labels: Block display, mb-2, font-medium text-sm
- Validation: Inline error messages below fields with icon prefix

## Data Visualization Patterns

**Delta Display Strategy**:
- Always show: Old Value → New Value (Delta)
- Use arrows: ↑ for increase, ↓ for decrease, — for no change
- Percentage changes for ratios (e.g., tire pressure)
- Absolute values for measurements (e.g., ride height in mm)

**Change Grouping**:
- Major changes: Visually prominent, top of relevant sections
- Moderate changes: Standard display
- Minor/no changes: Collapsed by default, expandable

## Responsive Behavior

**Desktop (lg+)**: Three-column comparison, sidebar navigation visible
**Tablet (md)**: Two-column comparison, deltas shown on tap, navigation drawer
**Mobile (base)**: Stacked single-column, tabbed view switching between Setup A/B, swipeable cards

## Accessibility Features
- Keyboard navigation for all comparison parameters
- Screen reader labels for delta indicators and change magnitudes
- ARIA landmarks for main regions (comparison, interpretation, navigation)
- Focus management in modal dialogs and upload flows

## Images

**Hero/Dashboard Header**: Racing-inspired abstract background showing blurred motion or track curves (full-width, h-48). Overlaid elements (title, quick stats) use backdrop-blur-sm backgrounds.

**Empty States**: Illustrations for:
- No comparisons yet: Simple line art of two setup sheets side-by-side
- Upload areas: Drag-drop metaphor with document icons
- Error states: Friendly iconography

**No traditional hero section** - this is a utility application prioritizing immediate functionality.

## Animation Strategy
**Minimal and purposeful only**:
- Smooth transitions on accordion expand/collapse (200ms)
- Subtle hover states on interactive elements
- Loading spinners during file parsing
- No decorative animations - focus on instant responsiveness