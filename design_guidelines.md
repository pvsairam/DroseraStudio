# Drosera Studio — Design Guidelines

## Design Philosophy

**Core Principles:**
- Clarity over complexity: Display only meaningful data at a glance
- Motion as feedback: Subtle transitions, liquid animations, and intelligent hover responses
- Futuristic minimalism: Flat surfaces, blended gradients, and purposeful light use
- Human-centric feel: Every interaction should feel alive and responsive
- Configuration-first: All UI elements dynamically generated from configuration
- Performance & accessibility: WCAG AA compliant, reduced-motion friendly, PWA optimized

## Design Approach: Reference-Based (Web3 Dashboard)

**Primary Inspirations:**
- **Stripe Dashboard**: Clean, data-dense serenity with gradient highlights and impeccable spacing for KPI overviews
- **Linear App**: Next-generation motion design with spring transitions and dark mode brilliance for Admin Configuration UI
- **Vercel Dashboard**: Developer-focused, lightweight, modular cards for Trap Data & Event Monitoring
- **Crypto Operations Hub**: Real-time streaming data visualization for Live Trap Feed

## Color Palette

**Dark Mode (Primary):**
- Background: `#121212`
- Primary Accent: `#00A3FF` (Electric Blue)
- Secondary Accent: `#FF8A00` (Alert Orange)
- Success: `#2ECC71`
- Warning: `#F1C40F`
- Error: `#E74C3C`

**Light Mode:**
- Background: `#FAFAFA`
- Adjust accents for appropriate contrast

**Usage:**
- Primary blue for CTAs, active states, and data highlights
- Secondary orange exclusively for alerts and critical actions
- Success/Warning/Error for status indicators and trap severity levels
- Avoid neon gradients or rainbow palettes

## Typography

**Font Family:** Inter (primary) or IBM Plex Sans (fallback), with system-ui backup

**Scale:**
- Headings: 24–32px, weight 600 (SemiBold)
- Body: 16px, weight 400 (Regular)
- Captions: 14px, letter-spacing 0.5px
- Metrics/KPIs: Uppercase with generous letter-spacing

**Hierarchy:**
- Clear vertical rhythm with generous line-height (1.5)
- Wide spacing between sections
- Geometric precision in alignment

## Layout System

**Grid Structure:**
- 12-column responsive grid (desktop)
- 6-column tablet, 1-column mobile
- Base spacing unit: 8px (use Tailwind: p-2, p-4, p-8, p-12, p-16, p-20, p-24)
- Commonly use spacing: 2, 4, 8, 12, 16, 20, 24 units

**Page Structure:**
- **Header**: Time-range selector, density toggle (comfy/compact), theme toggle, user avatar
- **Sidebar**: Collapsible left rail (dynamic navigation from config) with icons and labels
- **Main Area**: KPI cards (top) → Charts (middle) → Live feeds and tables (bottom)
- **Admin Panel**: Configuration forms with live preview panes and JSON export

**Overview Page Layout:**
- Row 1: Four KPI CounterCards (Total Traps, Active Chains, Triggered Today, Avg Response Time)
- Row 2: Timeseries chart (2/3 width) + Donut chart (1/3 width)
- Row 3: Event Feed (2/3 width) + Status Table (1/3 width)

## Component Library

**Visual Treatment:**
- Border-radius: 12px for all cards and containers
- Shadows: `0 4px 16px rgba(0,0,0,0.08)` for standard elevation
- Depth: Respect material elevation with subtle layering

**Component Types:**
- **CounterCard**: Large metric with delta indicator and mini sparkline
- **TimeseriesChart**: Apache ECharts with live streaming, staged opacity animation
- **DonutChart**: Category breakdown with legend
- **Table**: Advanced filters, column chooser, pinned columns, CSV export
- **EventFeed**: Real-time streaming with severity pills, pause on hover
- **KPIGrid**: Metrics with comparison values
- **StatusPills**: Rounded, colored status indicators
- **Detail Drawer**: Slide-in panel with decoded parameters and transaction links
- **Empty States**: Minimal geometric motifs with helpful setup CTAs

## Motion & Animations

**Framer Motion Settings:**
- Spring physics: `stiffness: 120, damping: 14`
- All animations respect `prefers-reduced-motion`

**Animation Patterns:**
- **Page Transitions**: Fade + slide up 20px, 0.3s spring ease
- **Card Hover**: Scale 1.02, deepen shadow
- **Chart Load**: Staggered opacity rise (100ms intervals between elements)
- **Menu Expand**: Accordion with friction spring
- **Live Feed Ticker**: Horizontal auto-scroll, pause on hover
- **Focus Ring**: Visible, tasteful, with smooth transition

**Keyboard Shortcuts:**
- Search: `g` then `s`
- Quick add: `q`
- Help: `?`

## Accessibility

- Full keyboard navigation for every control
- Visible focus ring with 3:1 contrast minimum
- `aria-live="polite"` for trap event feed
- Skip links for main content
- High contrast mode option
- Reduced-motion support throughout

## Performance

- Lazy load charts and heavy components
- LCP target: < 2.5s on 4G
- CLS target: < 0.1
- Preload key routes and critical fonts
- PWA manifest with offline shell for dashboard chrome

## Visual Language

**Avoid:**
- Generic AI/template aesthetics
- Neon overload or unnecessary 3D parallax
- Overcrowded tables or excessive bright colors
- Long transition delays
- Glassmorphism effects

**Embrace:**
- Calm, purposeful data presentation
- Fluid, spring-based motion
- Generous whitespace where meaningful
- Precision in typography and alignment
- Subtle depth through shadow and elevation
- Living, responsive interface feel

## Images

No hero images required. This is a data-dense dashboard application focused on real-time monitoring and configuration management. Visual interest comes from data visualization (charts, live feeds, status indicators) rather than marketing imagery.