# ShopVerse – DevOps Infrastructure

##🌐 Live Deployment

Application URL: http://13.53.172.109/

---

## Overview

ShopVerse is a containerized MERN application deployed on AWS EC2. The infrastructure leverages Docker, Docker Compose, and Nginx to provide a scalable and maintainable deployment architecture.

---

## Infrastructure Stack

* AWS EC2
* Ubuntu Linux
* Docker
* Docker Compose
* Nginx
* Git & GitHub

---

## Architecture

```text
Developer
     │
     ▼
GitHub Repository
     │
     ▼
AWS EC2
     │
     ▼
Docker Compose
 ┌─────────────┬─────────────┐
 │             │
 ▼             ▼
Frontend     Backend
Container    Container
      │
      ▼
    Nginx
      │
      ▼
   End Users
```

---

## Deployment Workflow

### Clone Repository

```bash
git clone https://github.com/swatiparihar18/ShopVerse.git
cd ShopVerse
```

### Build and Start Containers

```bash
docker compose up -d --build
```

### Verify Running Containers

```bash
docker ps
```

### View Logs

```bash
docker compose logs -f
```

### Stop Services

```bash
docker compose down
```

---

## DevOps Practices

* Containerized deployment using Docker.
* Multi-service management with Docker Compose.
* Reverse proxy configuration using Nginx.
* Version control with Git and GitHub.
* Environment-based configuration management.
* Reproducible deployments on AWS EC2.

---

## Future Enhancements

* CI/CD pipeline using GitHub Actions.
* SSL/TLS integration with Let's Encrypt.
* Monitoring with Prometheus and Grafana.
* Centralized logging with ELK Stack.
* Infrastructure provisioning using Terraform.
* Container orchestration with Kubernetes.
* Automated backup and disaster recovery.
* Blue-Green and Rolling deployment strategies.

---

## Current Status

✅ AWS EC2 Deployment

✅ Dockerized Application

✅ Docker Compose Configuration

✅ Nginx Reverse Proxy

✅ GitHub Version Control

🔄 CI/CD Pipeline (Planned)

🔄 Monitoring and Observability (Planned)

🔄 Infrastructure as Code with Terraform (Planned)
