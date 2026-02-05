#!/bin/bash
# Bash script for quick setup of Teacher Rating System
# Usage: ./setup-teachers.sh

echo ""
echo "========================================"
echo "   TEACHER RATING SYSTEM SETUP"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the 'secka' directory"
    exit 1
fi

echo "✅ Found package.json"

# Step 1: Check environment variables
echo ""
echo "📋 Step 1: Checking environment variables..."

if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found!"
    echo "Please create .env.local with required variables"
    echo ""
    echo "Required variables:"
    echo "  - DATABASE_URL"
    echo "  - NEXTAUTH_SECRET"
    echo "  - NEXTAUTH_URL"
    echo "  - NEXT_PUBLIC_SUPABASE_URL"
    echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ Found .env.local"
fi

# Step 2: Install dependencies
echo ""
echo "📦 Step 2: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ npm install failed!"
    exit 1
fi
echo "✅ Dependencies installed"

# Step 3: Generate Prisma Client
echo ""
echo "🔧 Step 3: Generating Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Prisma generate failed!"
    exit 1
fi
echo "✅ Prisma Client generated"

# Step 4: Push database schema
echo ""
echo "🗄️  Step 4: Syncing database schema..."
npx prisma db push --accept-data-loss
if [ $? -ne 0 ]; then
    echo "❌ Database sync failed!"
    echo "Please check your DATABASE_URL in .env.local"
    exit 1
fi
echo "✅ Database schema synced"

# Step 5: Seed database
echo ""
echo "🌱 Step 5: Seeding database with test data..."
npm run prisma:seed
if [ $? -ne 0 ]; then
    echo "⚠️  Seeding failed (this is OK if data already exists)"
else
    echo "✅ Database seeded with test data"
fi

# Step 6: Success message
echo ""
echo "========================================"
echo "   SETUP COMPLETED SUCCESSFULLY! 🎉"
echo "========================================"
echo ""

echo "📊 Test Data Created:"
echo "  • Admin account: admin@sechenov.plus / admin123"
echo "  • 50 medical subjects"
echo "  • 6 sample teachers"
echo ""

echo "🚀 Next Steps:"
echo "  1. npm run dev                    - Start development server"
echo "  2. Open http://localhost:3000"
echo "  3. Login as admin@sechenov.plus / admin123"
echo "  4. Visit /teachers to see teacher ratings"
echo "  5. Visit /admin/teachers to manage teachers"
echo ""

echo "📖 Documentation:"
echo "  • QUICK_START_TEACHERS.md     - Quick start guide"
echo "  • TEACHER_RATING_SETUP.md     - Full documentation"
echo "  • SUPABASE_SETUP.md           - Supabase configuration"
echo "  • VERCEL_DEPLOYMENT.md        - Deployment guide"
echo ""

echo "🔧 Supabase Setup (Optional):"
echo "  • Create 'teachers' bucket in Supabase Storage"
echo "  • See SUPABASE_SETUP.md for detailed instructions"
echo ""

read -p "Start development server now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Starting development server..."
    echo "Press Ctrl+C to stop"
    echo ""
    npm run dev
fi

echo ""
echo "✅ Setup complete! Happy coding! 🎓"
echo ""
