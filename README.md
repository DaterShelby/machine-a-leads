# Machine a Leads - SaaS Lead Generation Platform

Une plateforme SaaS moderne et alimentée par l'IA pour générer des leads qualifiés sur plusieurs marchés verticaux. Construite avec Next.js 14, Tailwind CSS et TypeScript.

A modern, AI-powered SaaS platform for generating qualified leads across multiple vertical markets. Built with Next.js 14, Tailwind CSS, and TypeScript.

## Features

- **Multi-Vertical Support**: Identify prospects across 8 different sectors (Pisciniste, Solaire, Paysagiste, etc.)
- **AI-Generated Visuals**: Automatic before/after image generation for property improvement services
- **Lead Generation**: Automated lead identification and qualification pipeline
- **Modern Dashboard**: Responsive sidebar navigation with campaign management
- **Dark Theme**: Professional dark UI with blue accent color (#2563EB)
- **Authentication Ready**: Structured for Supabase integration

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **UI Components**: Custom component library with CVA
- **Language**: TypeScript
- **Font**: Inter (Google Fonts)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout with metadata
│   ├── page.tsx                   # Landing page
│   ├── globals.css                # Global Tailwind styles
│   ├── (auth)/
│   │   ├── layout.tsx             # Auth layout (centered card)
│   │   ├── login/page.tsx         # Login page
│   │   └── register/page.tsx      # Registration page
│   └── (dashboard)/
│       ├── layout.tsx             # Dashboard layout with sidebar
│       └── page.tsx               # Dashboard home
├── components/
│   ├── ui/                        # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   └── select.tsx
│   └── shared/                    # Shared features
│       ├── stats-card.tsx
│       └── data-table.tsx
└── middleware.ts                  # Auth protection middleware
```

## Key Components

### UI Components
- **Button**: Multiple variants (default, destructive, outline, secondary, ghost, link)
- **Card**: Container component with header, title, description, content, footer
- **Input**: Text input with label support
- **Badge**: Status indicators with multiple color variants
- **Select**: Styled dropdown selector

### Shared Components
- **StatsCard**: KPI display with trend indicators
- **DataTable**: Reusable table with pagination and empty states

## Getting Started

### Prerequisites
- Node.js 18+ (for Next.js 14)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

### Build

```bash
npm run build
npm start
```

## Environment Variables Setup

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Apply migrations to set up the database schema:
   ```bash
   # Run migrations in Supabase SQL Editor
   # Migrations should include tables for:
   # - users (with auth)
   # - campaigns
   # - leads
   # - verticals
   ```

## Authentication Setup

The project is structured for Supabase authentication:

1. Configure Supabase auth in your project settings
2. Implement auth functions in:
   - `src/app/(auth)/login/page.tsx`
   - `src/app/(auth)/register/page.tsx`
   - `src/middleware.ts`
3. Use Supabase SSR utilities from `@supabase/ssr` package

## Color Scheme

- **Primary**: Blue (#2563EB)
- **Background**: Slate-950 (#020617)
- **Secondary**: Slate-900 (#0f172a)
- **Text**: Slate-50 (#f8fafc)
- **Accent**: Blue-400 (#60a5fa)

## Responsive Design

- Mobile-first approach
- Collapsible sidebar on smaller screens
- Grid layouts adapt from 1 to 4 columns
- Touch-friendly button sizes

## Customization

### Adding New Dashboard Routes
Create new folders under `src/app/(dashboard)/`:
```
src/app/(dashboard)/campaigns/page.tsx
src/app/(dashboard)/leads/page.tsx
// etc.
```

### Extending UI Components
All components use Tailwind CSS and support className prop for customization.

## Deployment

### Netlify Deployment

The project is configured for deployment on Netlify:

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Set build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18+
4. Add environment variables in Netlify dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Deploy

The `netlify.toml` configuration file handles build optimization and Next.js plugin setup.

### Production Build

```bash
npm run build
npm start
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Get current session

### Campaign Endpoints
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign details
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign

### Lead Endpoints
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `GET /api/leads/:id` - Get lead details
- `PUT /api/leads/:id` - Update lead

## Future Enhancements

- Real-time lead data updates with Supabase Realtime
- Advanced filtering and search capabilities
- Campaign analytics and reporting dashboards
- Email template builder
- AI-powered lead scoring system
- CRM integrations
- API integration for third-party services
- Mobile application

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

© 2024 Machine a Leads. All rights reserved.
