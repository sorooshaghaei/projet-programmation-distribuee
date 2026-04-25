#!/bin/sh
set -e

python wait_for_db.py
python manage.py migrate --noinput
exec gunicorn event_service.wsgi:application --bind 0.0.0.0:8000
