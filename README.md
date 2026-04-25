# EventHub

EventHub is a small distributed event-management platform built as the project
for the **Programmation distribuée** course. It implements the technologies
imposed by the subject: microservices, REST web services, Docker, Kubernetes,
a single gateway entry point, and a persistent database.

The full written report is in [`report/report.pdf`](report/report.pdf)
(LaTeX source in [`report/report.tex`](report/report.tex)).

## Team

Three authors, M1 Vision et Machine Intelligente (VMI):

- **Mehdi AGHAEI**
- **Maksym DOLHOV**
- **Fallou DIOUF**

Work was split across three axes — backend (Django services), frontend (React),
infrastructure (Docker, Kubernetes, security) — with cross reviews.

## Components

| Component           | Tech                               | Role                                           |
|---------------------|------------------------------------|------------------------------------------------|
| `event-service`     | Python 3.12, Django REST Framework | Events CRUD + categories                       |
| `user-service`      | Python 3.12, Django REST + JWT     | Registration, login, refresh, profile          |
| `frontend-service`  | React 18 + Vite, served by Nginx   | Web UI                                         |
| `gateway`           | Nginx 1.27                         | Local reverse proxy (Docker Compose)           |
| `k8s/`              | Kubernetes YAML                    | Cluster manifests (Minikube / GKE compatible)  |
| `postgres`          | PostgreSQL 16                      | StatefulSet with PV/PVC, two logical databases |

## Architecture

```text
                        Browser
                            |
                            v
                 +----------------------+
                 |  Gateway / Ingress   |   (Nginx local / Nginx Ingress K8s)
                 +----------------------+
                   /        |         \
                  /         |          \
         /events          /users          /
            |               |             |
            v               v             v
    event-service     user-service    frontend-service
            \               /
             \             /
              v           v
           +--------------------+
           |   PostgreSQL 16    |
           |  (StatefulSet K8s) |
           +--------------------+
    DBs: eventhub_events  /  eventhub_users
```

Services do not call each other directly. The frontend obtains a JWT from
`user-service` and attaches it to requests routed to `event-service` through
the gateway. PostgreSQL runs as a single instance with **two logical
databases**, giving each backend an isolated schema and its own credentials.

## API surface

### event-service

| Method | Path                         | Description              |
|--------|------------------------------|--------------------------|
| GET    | `/events/`                   | list events              |
| POST   | `/events/`                   | create event             |
| GET    | `/events/<id>/`              | event detail             |
| PUT    | `/events/<id>/`              | full update              |
| PATCH  | `/events/<id>/`              | partial update           |
| DELETE | `/events/<id>/`              | delete                   |
| GET    | `/events/categories/`        | list categories          |
| POST   | `/events/categories/`        | create category          |
| GET    | `/health/`                   | liveness / readiness     |

### user-service

| Method | Path                        | Description                     |
|--------|-----------------------------|---------------------------------|
| POST   | `/users/auth/register/`     | create account                  |
| POST   | `/users/auth/login/`        | obtain JWT access + refresh     |
| POST   | `/users/auth/refresh/`      | refresh access token            |
| GET    | `/users/profile/`           | authenticated profile           |
| GET    | `/health/`                  | liveness / readiness            |

## Grading ladder coverage

The subject uses a tiered grading ladder. Each tier is reflected by a section
of the report and by concrete files in the repo.

| Tier   | Requirement                                    | Status | Evidence                                                                 |
|--------|------------------------------------------------|--------|--------------------------------------------------------------------------|
| 10/20  | 1 service + Dockerfile + K8s deployment/service| ✅     | `services/event-service/Dockerfile`, `k8s/event-deployment.yaml`, `k8s/event-service.yaml` |
| 12/20  | Gateway (ingress or reverse proxy)             | ✅     | `gateway/nginx.conf`, `k8s/ingress.yaml`                                 |
| 14/20  | 2nd service connected through the gateway      | ✅     | `services/user-service/` + JWT flow wired via frontend                   |
| 16/20  | Database (local or cloud)                      | ✅     | `k8s/postgres-statefulset.yaml`, `k8s/postgres-pv*.yaml`, `infrastructure/postgres/init.sql` |
| 18/20  | Cluster security (RBAC, secrets, isolation)    | ⚠️     | `Secret` + `ConfigMap` split, `ClusterIP`-only backends, `k8s/rbac-viewer.yaml`; no service-mesh mTLS yet |
| 20/20  | Cloud deployment OR full hardening (bonus)     | 🟡     | Manifests GKE-ready; migration plan documented in report §Palier 20/20    |

## Local run with Docker Compose

The fastest way to demo the whole system:

```bash
cp .env.example .env
docker compose up --build
```

Then open:

- Frontend (via gateway): `http://localhost:8080`
- Event API (via gateway): `http://localhost:8080/events/`
- User API (via gateway): `http://localhost:8080/users/auth/login/`

Compose brings up five containers (`postgres`, `event-service`, `user-service`,
`frontend-service`, `gateway`) on an isolated bridge network. The Postgres
volume is a named volume (`postgres_data`) so data survives restarts.

### Local gateway routes

The local Nginx gateway mirrors the Kubernetes ingress rules exactly:

- `/events` → `event-service`
- `/users`  → `user-service`
- `/`       → `frontend-service`

The symmetry matters — the same URL graph works in `docker compose` and in
Kubernetes, so you don't have to reconfigure the frontend when switching
environments.

## Kubernetes deployment (Minikube)

### 1. Start Minikube and enable ingress

```bash
minikube start
minikube addons enable ingress
```

### 2. Build the images inside Minikube's Docker daemon

```bash
eval $(minikube docker-env)

docker build -t eventhub-event-service:latest    ./services/event-service
docker build -t eventhub-user-service:latest     ./services/user-service
docker build -t eventhub-frontend-service:latest ./services/frontend-service
```

### 3. Apply the manifests

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/postgres-secret.yaml   -f k8s/postgres-configmap.yaml
kubectl apply -f k8s/postgres-pv.yaml       -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-service.yaml  -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/event-configmap.yaml   -f k8s/user-configmap.yaml
kubectl apply -f k8s/frontend-configmap.yaml
kubectl apply -f k8s/event-deployment.yaml    -f k8s/event-service.yaml
kubectl apply -f k8s/user-deployment.yaml     -f k8s/user-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml -f k8s/frontend-service.yaml
kubectl apply -f k8s/rbac-viewer.yaml
kubectl apply -f k8s/ingress.yaml
```

### 4. Resolve the host and open the app

```bash
echo "$(minikube ip) eventhub.local" | sudo tee -a /etc/hosts
```

Then open:

- `http://eventhub.local/`
- `http://eventhub.local/events/`
- `http://eventhub.local/users/auth/login/`

## Security elements

Aligned with tier 18/20 of the subject:

- Database credentials come from a Kubernetes `Secret`; no passwords in
  YAML manifests.
- `event-service` and `user-service` each have a separate DB user with
  access to only their own logical database.
- All backend services are `ClusterIP`-only — the `Ingress` is the single
  public entry point.
- PostgreSQL runs in a `StatefulSet` inside the `eventhub` namespace with a
  headless service; not reachable from outside.
- RBAC starter in `k8s/rbac-viewer.yaml` (`Role` + `RoleBinding` +
  `ServiceAccount` with read-only access to the namespace).
- Deliberately **not** included and listed as future work in the report:
  service-mesh mTLS (Istio), `NetworkPolicy` objects, CI/CD pipeline.

## Persistence

A single PostgreSQL instance hosts **two logical databases**:

- `eventhub_events` — owned by `event-service`
- `eventhub_users`  — owned by `user-service`

The databases, their roles, and their passwords are created at first
start by `infrastructure/postgres/init.sql`, mounted through a `ConfigMap`
into `/docker-entrypoint-initdb.d/`. Data is persisted via a
`PersistentVolumeClaim` bound to a `hostPath` `PersistentVolume` on
Minikube (swap for a dynamic `StorageClass` on GKE / AKS / EKS).

## Cloud deployment (tier 20/20)

The manifests are written to be cluster-agnostic. To run on GKE:

1. `gcloud container clusters create-auto eventhub --region=europe-west1`
2. Push images to Artifact Registry and update `image:` in each
   `*-deployment.yaml`.
3. Replace the `hostPath` `PersistentVolume` with
   `storageClassName: standard-rwo`.
4. `kubectl apply -f k8s/`.
5. Point a DNS / `/etc/hosts` entry at the Ingress external IP.

See the report for a full walkthrough and the Google Labs screenshots
that accompany the e-mail submission.

## Repository layout

```
eventhub_project/
├── docker-compose.yml
├── .env.example
├── gateway/
│   └── nginx.conf
├── infrastructure/
│   └── postgres/init.sql
├── k8s/                           # 19 Kubernetes manifests
├── services/
│   ├── event-service/             # Django REST (events + categories)
│   ├── user-service/              # Django REST (auth, JWT, profile)
│   └── frontend-service/          # React + Vite
└── report/
    ├── report.tex
    ├── report.pdf
    └── assets/
```

## Self-assessment

Report §Évaluation positions the deliverable at **16–18/20** on the
course grading ladder:

- Tiers 10, 12, 14, 16: fully covered and documented.
- Tier 18: main elements in place (Secrets, RBAC, isolation, restricted
  exposure). mTLS and `NetworkPolicy` not done.
- Tier 20: manifests ready for cloud; the bonus depends on the effective
  GKE deployment and the associated Google Labs screenshots joined to
  the e-mail submission.

## Notes

- Kubernetes manifests use local image names for Minikube. Retag and push
  to a registry for cloud deployment.
- The project is a solid demo implementation, not production-hardened.
  Production-grade improvements would include HTTPS at the Ingress,
  `NetworkPolicy` segmentation, a CI/CD pipeline, and stronger secret
  management (sealed secrets, Vault, etc.).
