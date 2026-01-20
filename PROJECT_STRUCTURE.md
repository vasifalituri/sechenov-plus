# Project Structure

```
medical-exam-platform/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Initial data (subjects)
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx       # Homepage dashboard
│   │   │   ├── materials/
│   │   │   │   ├── page.tsx   # Browse materials
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx # Material detail
│   │   │   │   └── upload/
│   │   │   │       └── page.tsx
│   │   │   ├── discussions/
│   │   │   │   ├── page.tsx   # Browse discussions
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx # Thread detail
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   └── profile/
│   │   │       └── page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx       # Admin dashboard
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   ├── materials/
│   │   │   │   └── page.tsx
│   │   │   ├── discussions/
│   │   │   │   └── page.tsx
│   │   │   └── analytics/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   ├── materials/
│   │   │   │   ├── route.ts
│   │   │   │   ├── [id]/
│   │   │   │   │   └── route.ts
│   │   │   │   └── download/
│   │   │   │       └── [id]/
│   │   │   │           └── route.ts
│   │   │   ├── discussions/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       └── comments/
│   │   │   │           └── route.ts
│   │   │   └── admin/
│   │   │       ├── users/
│   │   │       │   └── route.ts
│   │   │       ├── approve/
│   │   │       │   └── route.ts
│   │   │       └── analytics/
│   │   │           └── route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                # Shadcn components
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── materials/
│   │   │   ├── MaterialCard.tsx
│   │   │   ├── MaterialList.tsx
│   │   │   ├── MaterialUpload.tsx
│   │   │   └── MaterialPreview.tsx
│   │   ├── discussions/
│   │   │   ├── ThreadCard.tsx
│   │   │   ├── ThreadList.tsx
│   │   │   ├── CommentThread.tsx
│   │   │   └── CommentForm.tsx
│   │   ├── admin/
│   │   │   ├── UserApprovalTable.tsx
│   │   │   ├── ContentModerationTable.tsx
│   │   │   └── AnalyticsCards.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── shared/
│   │       ├── FileUpload.tsx
│   │       └── LoadingSpinner.tsx
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client
│   │   ├── auth.ts            # NextAuth config
│   │   ├── utils.ts           # Utility functions
│   │   └── constants.ts       # Constants (subjects, years)
│   └── types/
│       └── index.ts           # TypeScript types
├── public/
│   └── uploads/               # File storage
├── .env.local                 # Environment variables
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Key Routes

### Public Routes
- `/login` - Login page
- `/register` - Registration page (creates PENDING user)

### Protected Routes (Approved Users Only)
- `/` - Homepage dashboard
- `/materials` - Browse materials
- `/materials/[id]` - Material detail & download
- `/materials/upload` - Upload new material
- `/discussions` - Browse discussions by year/subject
- `/discussions/[id]` - Thread with nested comments
- `/discussions/new` - Create new thread
- `/profile` - User profile

### Admin Routes
- `/admin` - Admin dashboard
- `/admin/users` - User approval
- `/admin/materials` - Material moderation
- `/admin/discussions` - Discussion moderation
- `/admin/analytics` - Platform analytics

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (NextAuth)

### Materials
- `GET /api/materials` - List materials (filtered)
- `POST /api/materials` - Upload material
- `GET /api/materials/[id]` - Get material details
- `GET /api/materials/download/[id]` - Download file
- `PATCH /api/materials/[id]` - Update material
- `DELETE /api/materials/[id]` - Delete material

### Discussions
- `GET /api/discussions` - List threads
- `POST /api/discussions` - Create thread
- `GET /api/discussions/[id]` - Get thread with comments
- `POST /api/discussions/[id]/comments` - Add comment
- `PATCH /api/discussions/[id]` - Update thread
- `DELETE /api/discussions/[id]` - Delete thread

### Admin
- `GET /api/admin/users` - List users for approval
- `PATCH /api/admin/users/[id]` - Approve/reject user
- `POST /api/admin/approve` - Bulk approve content
- `GET /api/admin/analytics` - Get analytics data
