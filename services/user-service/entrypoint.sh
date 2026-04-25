#!/bin/sh
set -e

python wait_for_db.py
python manage.py migrate --noinput
exec gunicorn user_service.wsgi:application --bind 0.0.0.0:8000
