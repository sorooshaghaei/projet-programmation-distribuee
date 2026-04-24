import os
import socket
import time

host = os.getenv("DB_HOST", "localhost")
port = int(os.getenv("DB_PORT", "5432"))

for attempt in range(60):
    try:
        with socket.create_connection((host, port), timeout=2):
            print("Database is reachable")
            break
    except OSError:
        print(f"Waiting for database at {host}:{port} (attempt {attempt + 1}/60)")
        time.sleep(2)
else:
    raise SystemExit("Database did not become reachable in time")
