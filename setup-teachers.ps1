# PowerShell script for quick setup of Teacher Rating System
# Usage: ./setup-teachers.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   TEACHER RATING SYSTEM SETUP" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the 'secka' directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found package.json" -ForegroundColor Green

# Step 1: Check environment variables
Write-Host ""
Write-Host "📋 Step 1: Checking environment variables..." -ForegroundColor Cyan

if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  Warning: .env.local not found!" -ForegroundColor Yellow
    Write-Host "Please create .env.local with required variables" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Required variables:" -ForegroundColor White
    Write-Host "  - DATABASE_URL" -ForegroundColor White
    Write-Host "  - NEXTAUTH_SECRET" -ForegroundColor White
    Write-Host "  - NEXTAUTH_URL" -ForegroundColor White
    Write-Host "  - NEXT_PUBLIC_SUPABASE_URL" -ForegroundColor White
    Write-Host "  - NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor White
    Write-Host "  - SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
} else {
    Write-Host "✅ Found .env.local" -ForegroundColor Green
}

# Step 2: Install dependencies
Write-Host ""
Write-Host "📦 Step 2: Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Step 3: Generate Prisma Client
Write-Host ""
Write-Host "🔧 Step 3: Generating Prisma Client..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma generate failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma Client generated" -ForegroundColor Green

# Step 4: Push database schema
Write-Host ""
Write-Host "🗄️  Step 4: Syncing database schema..." -ForegroundColor Cyan
npx prisma db push --accept-data-loss
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Database sync failed!" -ForegroundColor Red
    Write-Host "Please check your DATABASE_URL in .env.local" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Database schema synced" -ForegroundColor Green

# Step 5: Seed database
Write-Host ""
Write-Host "🌱 Step 5: Seeding database with test data..." -ForegroundColor Cyan
npm run prisma:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Seeding failed (this is OK if data already exists)" -ForegroundColor Yellow
} else {
    Write-Host "✅ Database seeded with test data" -ForegroundColor Green
}

# Step 6: Success message
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   SETUP COMPLETED SUCCESSFULLY! 🎉" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Test Data Created:" -ForegroundColor Cyan
Write-Host "  • Admin account: admin@sechenov.plus / admin123" -ForegroundColor White
Write-Host "  • 50 medical subjects" -ForegroundColor White
Write-Host "  • 6 sample teachers" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. npm run dev                    - Start development server" -ForegroundColor White
Write-Host "  2. Open http://localhost:3000" -ForegroundColor White
Write-Host "  3. Login as admin@sechenov.plus / admin123" -ForegroundColor White
Write-Host "  4. Visit /teachers to see teacher ratings" -ForegroundColor White
Write-Host "  5. Visit /admin/teachers to manage teachers" -ForegroundColor White
Write-Host ""

Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "  • QUICK_START_TEACHERS.md     - Quick start guide" -ForegroundColor White
Write-Host "  • TEACHER_RATING_SETUP.md     - Full documentation" -ForegroundColor White
Write-Host "  • SUPABASE_SETUP.md           - Supabase configuration" -ForegroundColor White
Write-Host "  • VERCEL_DEPLOYMENT.md        - Deployment guide" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Supabase Setup (Optional):" -ForegroundColor Cyan
Write-Host "  • Create 'teachers' bucket in Supabase Storage" -ForegroundColor White
Write-Host "  • See SUPABASE_SETUP.md for detailed instructions" -ForegroundColor White
Write-Host ""

$startDev = Read-Host "Start development server now? (y/n)"
if ($startDev -eq "y") {
    Write-Host ""
    Write-Host "🚀 Starting development server..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    npm run dev
}

Write-Host ""
Write-Host "✅ Setup complete! Happy coding! 🎓" -ForegroundColor Green
Write-Host ""
