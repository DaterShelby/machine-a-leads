# Machine a Leads - Setup & Deployment Guide

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

### Core App Files

#### Layout & Metadata
- `/src/app/layout.tsx` - Root layout with Inter font and metadata
- `/src/app/globals.css` - Global Tailwind styles

#### Public Pages
- `/src/app/page.tsx` - Landing page with hero, features, stats, CTA

#### Authentication Routes (Group: `(auth)`)
- `/src/app/(auth)/layout.tsx` - Auth layout with centered card design
- `/src/app/(auth)/login/page.tsx` - Login form (email/password)
- `/src/app/(auth)/register/page.tsx` - Registration form (name, email, password, company, sector)

#### Dashboard Routes (Group: `(dashboard)`)
- `/src/app/(dashboard)/layout.tsx` - Dashboard layout with collapsible sidebar
- `/src/app/(dashboard)/page.tsx` - Dashboard home with KPI stats and recent leads table

### UI Components (`/src/components/ui/`)

All components use Tailwind CSS and class-variance-authority (CVA) for variants.

1. **button.tsx**
   - Variants: default, destructive, outline, secondary, ghost, link
   - Sizes: default, sm, lg, icon
   - Usage: `<Button variant="default" size="lg">Click me</Button>`

2. **card.tsx**
   - Components: Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
   - Usage: Wrap content in Card > CardHeader > CardTitle/CardDescription, then CardContent

3. **input.tsx**
   - Properties: id, name, type, placeholder, disabled, required
   - Usage: `<Input type="email" placeholder="user@example.com" />`

4. **badge.tsx**
   - Variants: default, secondary, destructive, outline, success, warning
   - Usage: `<Badge variant="success">Qualified</Badge>`

5. **select.tsx**
   - Styled HTML select element
   - Usage: `<Select><option>Value</option></Select>`

### Shared Components (`/src/components/shared/`)

1. **stats-card.tsx**
   - Props: icon, label, value, change (percentage + isPositive)
   - Shows KPI with trend indicator
   - Usage: `<StatsCard icon={<Users />} label="Total Leads" value="1,234" change={{ percentage: 12, isPositive: true }} />`

2. **data-table.tsx**
   - Props: columns, data, loading, emptyMessage, pageSize, currentPage, onPageChange
   - Reusable table with pagination
   - Column render function support for custom formatting

### Middleware & Auth

- `/src/middleware.ts` - Route protection for dashboard (TODO: Implement Supabase)

## Design System

### Color Palette
- **Primary**: Blue (#2563EB)
- **Background**: Slate-950 (#020617)
- **Dark Surface**: Slate-900 (#0f172a)
- **Text**: Slate-50 (#f8fafc)
- **Muted**: Slate-400 (#94a3b8)

### Tailwind Configuration
- Extended slate and blue color scales
- Custom CSS utilities in globals.css
- Root font: Inter (Google Fonts)

### Component Spacing
- Gap/padding: 4px increments (px-2, px-4, px-6, etc.)
- Border colors: slate-800, slate-600
- Hover states: All interactive elements

## Feature Pages

### Landing Page (`/src/app/page.tsx`)
Sections:
1. Navigation bar with login/register links
2. Hero section with gradient title
3. Stats bar (2000+ properties/day, 8 sectors, 25%+ open rate)
4. 3 feature cards (Multi-Vertical, IA Generative, Automatisé)
5. CTA section with gradient background
6. Footer

### Login Page (`/src/app/(auth)/login/page.tsx`)
Form fields:
- Email input
- Password input
- Submit button
- Link to register page

States:
- Loading state during submission
- Error message display
- TODO: Supabase signInWithPassword integration

### Register Page (`/src/app/(auth)/register/page.tsx`)
Form fields:
- Full name
- Email
- Password
- Company name
- Sector dropdown (Pisciniste, Solaire, Paysagiste, Général)

States:
- Loading state
- Sector validation
- Error handling
- TODO: Supabase signUp integration

### Dashboard Layout (`/src/app/(dashboard)/layout.tsx`)
Features:
- Collapsible sidebar (toggle with menu button)
- Logo "ML" with gradient
- Navigation items with icons:
  - Dashboard (LayoutDashboard)
  - Campaigns (Megaphone)
  - Leads (Users)
  - Pipeline (GitBranch)
  - Templates (Mail)
  - Verticaux (Layers)
  - Settings (Settings)
- User info section (name, email)
- Logout button
- Top bar with page title

Styling:
- Sidebar: #111827 (slate-900)
- Icons collapse to sidebar-only view on mobile
- Smooth 300ms transitions

### Dashboard Home (`/src/app/(dashboard)/page.tsx`)
Displays:
- 4 KPI stats with trends (Total Leads, Active Campaigns, Conversion Rate, Revenue)
- Recent leads data table with status badges
- Responsive grid layout

## Supabase Integration (TODO)

### Required Setup
1. Create Supabase project
2. Set environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```

### Files to Update
1. `/src/app/(auth)/login/page.tsx` - Add signInWithPassword
2. `/src/app/(auth)/register/page.tsx` - Add signUp with metadata
3. `/src/middleware.ts` - Check authentication for /dashboard routes
4. Create `/src/lib/supabase/client.ts` - Supabase client initialization
5. Create `/src/lib/supabase/server.ts` - Server-side Supabase helpers

### Auth Flow
```
User Registration
  -> POST /register (signUp with user data)
  -> Email verification (optional)
  -> Redirect to login

User Login
  -> POST /login (signInWithPassword)
  -> Set session cookie
  -> Redirect to /dashboard

Protected Routes
  -> Middleware checks auth
  -> Redirect to /login if not authenticated
```

## Scripts

```bash
# Development
npm run dev              # Start dev server on :3000

# Build & Production
npm run build            # Next.js production build
npm start                # Start production server
npm run type-check       # Run TypeScript type checking

# Linting
npm run lint             # Run ESLint
```

## Dependencies

### Core
- `next` 14.0.0
- `react` 18.2.0
- `react-dom` 18.2.0

### UI & Styling
- `tailwindcss` 3.3.0
- `lucide-react` 0.294.0 (Icons)
- `class-variance-authority` 0.7.0 (Component variants)

### Dev
- `typescript` 5.2.0
- `tailwindcss` 3.3.0
- `autoprefixer` 10.4.0
- `eslint` & `eslint-config-next`

## Key Features Implemented

1. **Modern UI Components**
   - CVA-based variants for consistent styling
   - Dark theme by default
   - Accessible form inputs

2. **Responsive Design**
   - Mobile-first approach
   - Collapsible navigation
   - Responsive grid layouts

3. **SaaS-Ready Architecture**
   - Auth route group
   - Dashboard route group
   - Middleware for protection
   - Structured for easy expansion

4. **Professional Design**
   - Gradient accents
   - Consistent spacing
   - Blue color scheme
   - Glass-morphism effects (optional CSS utility)

## Next Steps

1. Install `npm install`
2. Set up Supabase project
3. Configure environment variables
4. Implement authentication in login/register pages
5. Update middleware for auth checks
6. Create additional dashboard routes
7. Add API endpoints for leads/campaigns
8. Integrate third-party services (email, AI generation)

## Notes

- All files use absolute imports via `@/*` alias
- Components are server-side by default; use `"use client"` directive where needed
- Tailwind configuration supports dark mode and custom colors
- Icons from lucide-react (294+ icons available)
