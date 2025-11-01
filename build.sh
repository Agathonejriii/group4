#!/bin/bash

# Render Build Script for Django
set -e

echo "=== Starting Django Build on Render ==="

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --no-input

# Apply database migrations
echo "Running database migrations..."
python manage.py migrate --no-input

# Create superuser if needed (optional - remove in production)
# echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'password') if not User.objects.filter(username='admin').exists() else None" | python manage.py shell

echo "=== Build completed successfully! ==="
