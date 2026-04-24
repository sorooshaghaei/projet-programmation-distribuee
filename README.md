# EventHub

EventHub is a mini distributed system for a VMI-style project:

- `event-service` — Django REST microservice for event CRUD and categories
- `user-service` — Django REST microservice for registration, authentication, JWT, and profile management
- `frontend-service` — React frontend
- `gateway` — local Nginx reverse proxy for Docker Compose
- `k8s/` — Kubernetes manifests for Minikube, including Ingress, ConfigMaps, Secrets, and PostgreSQL persistence

This project is designed to match the grading ladder shown in the project brief:

- 10/20: 1 microservice + Docker + Kubernetes
- 12/20: gateway / ingress
- 14/20: 2 microservices + communication through a gateway
- 16/20: database / persistent volume
- 18/20: cluster security basics (Secrets, non-public services, RBAC starter manifest)
- 20/20: cloud deployment or stronger security / hardening

## Architecture

```text
Browser
   |
   v
Gateway / Ingress
   |------ /events -----> event-service -----> PostgreSQL (events DB)
   |------ /users  -----> user-service  -----> PostgreSQL (users DB)
   |
   \------ /          --> frontend-service
```

## Services

### event-service
- CRUD for events
- CRUD for categories
- PostgreSQL database
- Health endpoint

Main routes:
- `GET    /events/`
- `POST   /events/`
- `GET    /events/<id>/`
- `PUT    /events/<id>/`
- `PATCH  /events/<id>/`
- `DELETE /events/<id>/`
- `GET    /events/categories/`
- `POST   /events/categories/`
- `GET    /health/`

### user-service
- user registration
- JWT login / refresh
- authenticated profile endpoint
- health endpoint

Main routes:
- `POST /users/auth/register/`
- `POST /users/auth/login/`
- `POST /users/auth/refresh/`
- `GET  /users/profile/`
- `GET  /health/`

### frontend-service
- login / register UI
- event list
- event creation form
- category loading
- token stored in localStorage

## Local run with Docker Compose

This is the easiest way to test the full system locally.

```bash
cd eventhub_project
cp .env.example .env
docker compose up --build
```

Then open:

- Frontend through gateway: `http://localhost:8080`
- Event API through gateway: `http://localhost:8080/events/`
- User API through gateway: `http://localhost:8080/users/auth/login/`

### Local gateway routes

The local Nginx gateway mirrors the Kubernetes ingress behavior:

- `/events` -> `event-service`
- `/users` -> `user-service`
- `/` -> `frontend-service`

## Kubernetes deployment (Minikube)

### 1. Enable ingress

```bash
minikube addons enable ingress
```

### 2. Build images and load them into Minikube

```bash
docker build -t eventhub-event-service:latest ./services/event-service
docker build -t eventhub-user-service:latest ./services/user-service
docker build -t eventhub-frontend-service:latest ./services/frontend-service

minikube image load eventhub-event-service:latest
minikube image load eventhub-user-service:latest
minikube image load eventhub-frontend-service:latest
```

### 3. Apply manifests

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres-secret.yaml
kubectl apply -f k8s/postgres-configmap.yaml
kubectl apply -f k8s/postgres-pv.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-service.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/event-configmap.yaml
kubectl apply -f k8s/user-configmap.yaml
kubectl apply -f k8s/event-deployment.yaml
kubectl apply -f k8s/event-service.yaml
kubectl apply -f k8s/user-deployment.yaml
kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/frontend-configmap.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/rbac-viewer.yaml
kubectl apply -f k8s/ingress.yaml
```

### 4. Access the app

Add this line to `/etc/hosts` if needed:

```text
$(minikube ip) eventhub.local
```

Open:

- `http://eventhub.local/`
- `http://eventhub.local/events/`
- `http://eventhub.local/users/auth/login/`

## Security elements included

This project includes basic cluster security elements that help toward the higher grading bands:

- Kubernetes `Secret` for database credentials
- PostgreSQL password not stored in clear text inside deployments
- backend services exposed internally as `ClusterIP`
- ingress as the public entry point
- starter `Role` + `RoleBinding` manifest (`k8s/rbac-viewer.yaml`)

## Persistence

A single PostgreSQL instance is used with two logical databases:

- `eventhub_events`
- `eventhub_users`

That keeps the infrastructure simple while still giving each microservice its own database boundary.

## Deliverables included

- Dockerfiles for all three application services
- local gateway configuration
- Docker Compose file
- Django + React source code
- Kubernetes manifests
- PostgreSQL init scripts
- environment example file
- RBAC starter manifest

## Notes

- The Kubernetes manifests use local image names for Minikube. If you want Docker Hub deployment, retag the images and update the manifests.
- This is a solid project starter and demo implementation. For a production-grade version, you would typically add HTTPS, stricter network policies, CI/CD, and stronger secret management.
