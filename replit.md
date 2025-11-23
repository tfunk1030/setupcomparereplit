# SetupComparer - iRacing Setup Analysis Tool

## Overview

SetupComparer is a web application designed for iRacing sim racers to compare and analyze car setup files side-by-side. The application parses iRacing setup files, calculates differences between parameters, and provides intelligent interpretations of how setup changes may affect car performance. Users can upload two setup files, view detailed parameter comparisons organized by category (Suspension, Aero, Tires, Dampers, ARB), and share comparison results with others.

The application features a clean, technical interface inspired by Linear and Stripe Dashboard design principles, emphasizing data clarity and scan-friendly presentation suitable for racing-oriented technical analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool and development server.

**UI Component Library**: Shadcn UI built on Radix UI primitives, providing accessible and customizable components with a "new-york" style variant.

**Styling**: Tailwind CSS with custom design tokens for colors, spacing, and typography. The design system uses CSS variables for theming with support for light and dark modes. Typography employs Inter for general UI and JetBrains Mono for technical values and setup parameters.

**State Management**: TanStack Query (React Query) handles server state, caching, and data synchronization. Client-side routing is managed by Wouter, a lightweight routing library.

**Layout Strategy**: 
- Responsive grid-based layouts with max-width constraints (max-w-7xl for dashboards, max-w-2xl for forms)
- Three-panel horizontal split for comparison views
- Card-based UI for content organization
- Mobile-first responsive design with breakpoints at 768px

**Design Rationale**: The Shadcn UI + Radix combination provides production-ready accessible components while maintaining full customization control. Tailwind CSS enables rapid UI development with consistent spacing and colors. The racing-inspired design emphasizes technical precision with visual clarity, avoiding unnecessary decorative elements.

### Backend Architecture

**Server Framework**: Express.js running on Node.js with TypeScript.

**API Design**: RESTful endpoints for authentication, comparison management, and file uploads. Key routes include:
- `/api/auth/*` - Authentication flow using Replit Auth
- `/api/comparisons/upload` - File upload and comparison creation
- `/api/comparisons` - Retrieve user's comparison history
- `/api/comparisons/:id` - Individual comparison access
- `/share/:token` - Public sharing functionality

**File Processing**: Multer middleware handles multipart form uploads, storing files in memory as buffers. The setup parser processes iRacing setup file format (INI-style with sections and key-value pairs), normalizing parameter names and organizing data hierarchically.

**Comparison Engine**: 
- Calculates deltas between corresponding parameters in two setups
- Classifies change magnitude (none, minor, moderate, major)
- Generates interpretations explaining the likely impact of changes
- Supports nested parameter groups (e.g., front/rear suspension settings)

**Development vs Production**: Separate entry points (`index-dev.ts` and `index-prod.ts`) handle Vite integration in development mode versus serving static assets in production.

**Rationale**: Express provides a lightweight, flexible server framework suitable for file uploads and session management. The separation of parsing logic, delta calculation, and interpretation generation enables maintainable, testable code. Memory-based file storage avoids filesystem dependencies, suitable for serverless deployment.

### Authentication System

**Provider**: Replit Auth using OpenID Connect (OIDC) protocol.

**Implementation**: Passport.js strategy with OIDC client discovery, managing OAuth2 flows including token refresh.

**Session Management**: PostgreSQL-backed sessions using `connect-pg-simple` for persistent session storage across server restarts. Session cookies are httpOnly and secure in production with a 7-day TTL.

**User Model**: Stores user ID, email, name, and profile image URL. User records are upserted on login to maintain current profile information.

**Rationale**: Replit Auth simplifies authentication in the Replit environment while providing standard OIDC flows. PostgreSQL sessions ensure reliability and enable horizontal scaling. The passport strategy pattern allows future addition of alternative auth providers.

### Data Storage

**ORM**: Drizzle ORM with PostgreSQL dialect, providing type-safe database queries and schema management.

**Database Driver**: Neon serverless PostgreSQL driver with WebSocket support for connection pooling.

**Schema Design**:
- `users` - User profiles from authentication
- `comparisons` - Stores complete setup data, deltas, and interpretations as JSONB
- `sessions` - Express session storage

**JSONB Storage**: Setup data, deltas, and interpretations are stored as JSONB rather than normalized tables to preserve the hierarchical structure of setup files and simplify querying complete comparison objects.

**Sharing Mechanism**: Comparisons can be made public with a unique share token (UUID), enabling unauthenticated access via share links.

**Rationale**: Drizzle provides excellent TypeScript integration with minimal runtime overhead. JSONB storage is ideal for semi-structured data like parsed setup files where the schema may vary between car types. The Neon serverless driver enables connection pooling suitable for serverless deployment patterns.

## External Dependencies

### Third-Party Services

**Replit Auth**: OAuth2/OIDC authentication provider integrated into the Replit platform. Handles user identity, login flows, and token management.

**Neon Database**: Serverless PostgreSQL hosting with WebSocket support, provisioned via `DATABASE_URL` environment variable.

### UI Component Libraries

**Radix UI**: Headless accessible component primitives (@radix-ui/* packages) providing the foundation for all interactive components (dialogs, dropdowns, accordions, etc.).

**Shadcn UI**: Pre-configured Radix components with Tailwind styling, customizable via `components.json` configuration.

**Lucide React**: Icon library providing consistent iconography throughout the application.

### Development Tools

**Vite**: Build tool and development server with React plugin, HMR support, and Replit-specific plugins (runtime error overlay, cartographer, dev banner).

**Drizzle Kit**: Database migration and schema management tool configured for PostgreSQL.

**TypeScript**: Type checking and compilation, configured with strict mode and path aliases for clean imports.

### File Processing

**Multer**: Multipart form data handling for file uploads, configured with memory storage.

**Date-fns**: Date formatting and manipulation, used for displaying comparison timestamps.

### State Management

**TanStack Query**: Server state management with caching, background refetching, and mutation handling.

**React Hook Form + Zod**: Form state management with schema validation (via @hookform/resolvers).

### Session & Storage

**Express Session**: Session middleware with PostgreSQL store via `connect-pg-simple`.

**Memoizee**: Function memoization for OIDC configuration caching.

### Styling

**Tailwind CSS**: Utility-first CSS framework with custom configuration for design tokens.

**PostCSS + Autoprefixer**: CSS processing pipeline for vendor prefixing.

**Class Variance Authority**: Type-safe variant styling for components.