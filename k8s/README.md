# Kubernetes deployment for the library system

This guide shows the full step-by-step deployment process for the project using YAML manifests.

## 1. Prerequisites

Make sure you have:
- Docker installed and running
- kubectl installed
- a Kubernetes cluster available
- access to a container registry such as Docker Hub

### Local cluster options
If you are using Docker Desktop with Kubernetes enabled:
```bash
kubectl get nodes
```

If you are using Minikube:
```bash
minikube start
kubectl get nodes
```

## 2. Build and push container images

The manifests use a `library-sys-` prefix so they are less likely to collide with other team deployments in the same cluster. If you need a different prefix, replace it in the YAML files before applying them.

From the project root, build the images and push them to your registry:

```bash
eval $(minikube docker-env)

docker build -t library-sys-api-gateway:latest -f API_Gateway/Dockerfile .
docker build -t library-sys-auth-service:latest -f Auth_service/Dockerfile .
docker build -t library-sys-book-service:latest -f Book_service/Dockerfile .
docker build -t library-sys-borrow-service:latest -f Borrow_service/Dockerfile .

docker push library-sys-api-gateway:latest
docker push library-sys-auth-service:latest
docker push library-sys-book-service:latest
docker push library-sys-borrow-service:latest
```

Then replace the image values in the deployment YAML files with the exact image names you pushed.

## 3. Apply the Kubernetes manifests

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/mongo-pvc.yaml
kubectl apply -f k8s/mongo.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/shared-logs.yaml
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/book-service.yaml
kubectl apply -f k8s/borrow-service.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/ingress.yaml 
```

or simply 
```bash
kubectl apply -f k8s/
```
## 4. Create secrets for sensitive values

Do not commit your real credentials to GitHub. Inject them in secrets.yaml file at deployment time:

```bash
kubectl create secret generic library-secrets -n library-system \
  --from-literal=JWT_SECRET='<your-secret>' \
  --from-literal=MONGO_URI='<your-mongodb-atlas-uri>'
```



## 5. Verify the rollout

```bash
kubectl get pvc -n library-system
kubectl get pods -n library-system
kubectl get svc -n library-system
kubectl get ingress -n library-system
```

If a pod is not ready, inspect its logs:

```bash
kubectl logs -n library-system deploy/library-sys-api-gateway
kubectl logs -n library-system deploy/library-sys-auth-service
kubectl logs -n library-system deploy/library-sys-book-service
kubectl logs -n library-system deploy/library-sys-borrow-service
```

## 6. Access the application

### Option A: Service access
If you are using a cloud provider or Minikube tunnel, you can access the gateway service directly:

```bash
kubectl get svc -n library-system
```

### Option B: Ingress access
If your cluster has an ingress controller installed, use the ingress host:

```bash
kubectl get ingress -n library-system
```

## 7. Troubleshooting

If deployment fails, check:
```bash
kubectl describe pod -n library-system -l app=library-sys-api-gateway
kubectl describe pod -n library-system -l app=library-sys-auth-service
kubectl describe pod -n library-system -l app=library-sys-book-service
kubectl describe pod -n library-system -l app=library-sys-borrow-service
```
