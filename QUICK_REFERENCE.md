# Machine a Leads - Quick Reference

## Project Location
```
/sessions/confident-lucid-brahmagupta/machine-a-leads/
```

## Quick Start
```bash
cd /sessions/confident-lucid-brahmagupta/machine-a-leads
npm install
npm run dev
```

Visit: http://localhost:3000

## File Structure Quick Links

### Pages
- **Landing**: `src/app/page.tsx`
- **Login**: `src/app/(auth)/login/page.tsx`
- **Register**: `src/app/(auth)/register/page.tsx`
- **Dashboard**: `src/app/(dashboard)/page.tsx`

### Layouts
- **Root**: `src/app/layout.tsx`
- **Auth**: `src/app/(auth)/layout.tsx`
- **Dashboard**: `src/app/(dashboard)/layout.tsx`

### Components
- **UI**: `src/components/ui/`
  - button.tsx
  - card.tsx
  - input.tsx
  - badge.tsx
  - select.tsx
- **Shared**: `src/components/shared/`
  - stats-card.tsx
  - data-table.tsx

### Config
- Tailwind: `tailwind.config.ts`
- TypeScript: `tsconfig.json`
- Next.js: `next.config.js`
- Middleware: `src/middleware.ts`

## Component Usage Examples

### Button
```tsx
import { Button } from "@/components/ui/button";

<Button>Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button size="sm">Small</Button>
<Button size="icon"><Icon /></Button>
```

### Card
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

### Input
```tsx
import { Input } from "@/components/ui/input";

<Input type="email" placeholder="email@example.com" />
```

### Badge
```tsx
import { Badge } from "@/components/ui/badge";

<Badge variant="success">Qualified</Badge>
<Badge variant="warning">In Progress</Badge>
<Badge variant="destructive">Failed</Badge>
```

### Select
```tsx
import { Select } from "@/components/ui/select";

<Select onChange={(e) => setValue(e.target.value)}>
  <option value="">Select...</option>
  <option value="option1">Option 1</option>
</Select>
```

### StatsCard
```tsx
import { StatsCard } from "@/components/shared/stats-card";
import { Users } from "lucide-react";

<StatsCard
  icon={<Users className="w-6 h-6" />}
  label="Total Leads"
  value="1,234"
  change={{ percentage: 12, isPositive: true }}
/>
```

### DataTable
```tsx
import { DataTable } from "@/components/shared/data-table";

<DataTable
  columns={[
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
  ]}
  data={[
    { id: 1, name: "John", email: "john@example.com" },
  ]}
/>
```

## Color Reference

### Primary Colors
- `bg-blue-600` - Primary action
- `text-blue-400` - Text accent
- `hover:bg-blue-700` - Hover state

### Backgrounds
- `bg-slate-950` - Page background
- `bg-slate-900` - Card/surface
- `bg-slate-800` - Inputs

### Text
- `text-slate-50` - Primary text
- `text-slate-300` - Secondary text
- `text-slate-400` - Muted text

### Status Colors
- Success: `text-green-400` / `bg-green-900/20`
- Warning: `text-yellow-400` / `bg-yellow-900/20`
- Error: `text-red-400` / `bg-red-900/20`
- Info: `text-blue-400` / `bg-blue-900/20`

## Tailwind Utility Patterns

### Spacing
```
p-4     = padding 1rem
px-4    = horizontal padding
py-2    = vertical padding
m-4     = margin 1rem
gap-4   = gap between grid/flex items
```

### Responsive
```
md:      = 768px and up
lg:      = 1024px and up
sm:      = 640px and up
xs:      = only mobile
```

### Common Patterns
```
flex items-center justify-between
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4
rounded-lg border border-slate-800
hover:bg-slate-800 transition-colors
disabled:opacity-50 disabled:cursor-not-allowed
```

## Icons (lucide-react)

Common imports:
```tsx
import {
  LayoutDashboard,
  Users,
  Megaphone,
  GitBranch,
  Mail,
  Layers,
  Settings,
  LogOut,
  TrendingUp,
  TrendingDown,
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  Zap,
  Palette,
  Cpu,
} from "lucide-react";
```

Usage:
```tsx
<Icon className="w-6 h-6 text-blue-400" />
<Icon className="w-4 h-4" />
```

## Routes

### Public
- `/` - Landing page
- `/login` - Login
- `/register` - Register

### Protected (TODO: Add middleware check)
- `/dashboard` - Home
- `/dashboard/campaigns` - Campaigns
- `/dashboard/leads` - Leads
- `/dashboard/pipeline` - Pipeline
- `/dashboard/templates` - Templates
- `/dashboard/verticaux` - Sectors
- `/dashboard/settings` - Settings

## Environment Setup (TODO)

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
```

## Useful Commands

```bash
# Development
npm run dev              # Start dev server

# Building
npm run build            # Build for production
npm start                # Start production server
npm run type-check       # Check TypeScript

# Linting
npm run lint             # Run ESLint
```

## Tips & Best Practices

1. **Use path aliases**: `@/components/ui/button` instead of `../../../components/ui/button`

2. **Use "use client" for interactivity**:
   ```tsx
   "use client";
   import { useState } from "react";
   ```

3. **Component organization**:
   - UI components in `src/components/ui/`
   - Feature components in `src/components/shared/`
   - Pages in `src/app/`

4. **Styling**:
   - Use Tailwind utility classes
   - Use CVA for component variants
   - Keep consistent spacing (4px increments)

5. **Icons**:
   - Import from `lucide-react`
   - Always add className for sizing: `w-5 h-5`
   - Use consistent sizing across similar components

6. **Forms**:
   - Use Input component for text fields
   - Use Select component for dropdowns
   - Always include labels for accessibility
   - Handle loading states and errors

## Troubleshooting

**Q: Imports not working?**
A: Make sure `tsconfig.json` has correct paths and restart dev server

**Q: Tailwind styles not appearing?**
A: Check `tailwind.config.ts` content paths include your files

**Q: Components not rendering?**
A: Check if page needs `"use client"` directive for interactivity

**Q: Supabase not working?**
A: Verify environment variables and check console for errors

## Documentation Files
- `README.md` - Project overview
- `SETUP.md` - Installation & deployment guide
- `FILES_CREATED.txt` - Complete file listing
- `QUICK_REFERENCE.md` - This file
