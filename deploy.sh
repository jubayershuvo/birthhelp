#!/bin/bash

set -e  # ❗ STOP script immediately on any error

echo "🚀 Pulling latest codes..."
git reset --hard
git pull origin main

echo "📦 Installing dependencies..."
npm install --production

echo "⚙️ Building project..."
if ! npm run build; then
  echo "❌ Build failed! PM2 will NOT restart."
  exit 1
fi

echo "♻️ Restarting PM2..."
pm2 restart birthhelp

echo "✅ Deployment complete!"
