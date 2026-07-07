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
docker build -t <your-docker-username>/api-gateway:latest -f API_Gateway/Dockerfile .
docker build -t <your-docker-username>/auth-service:latest -f Auth_service/Dockerfile .
docker build -t <your-docker-username>/book-service:latest -f Book_service/Dockerfile .
docker build -t <your-docker-username>/borrow-service:latest -f Borrow_service/Dockerfile .

docker push <your-docker-username>/api-gateway:latest
docker push <your-docker-username>/auth-service:latest
docker push <your-docker-username>/book-service:latest
docker push <your-docker-username>/borrow-service:latest
```

Then replace the image values in the deployment YAML files with the exact image names you pushed.

## 3. Create secrets for sensitive values

Do not commit your real credentials to GitHub. Inject them in secrets.yaml file at deployment time:

```bash
kubectl create secret generic library-secrets -n library-system \
  --from-literal=JWT_SECRET='<your-secret>' \
  --from-literal=MONGO_URI='<your-mongodb-atlas-uri>'
```

## 4. Apply the Kubernetes manifests

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/mongo.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/book-service.yaml
kubectl apply -f k8s/borrow-service.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/ingress.yaml
```

## 5. Verify the rollout

```bash
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

## Configure Fanout DNS (library.com) for local testing

This project uses the Ingress host `library.com` to demonstrate fanout DNS routing. For local Minikube testing, map `library.com` to the cluster IP (or use an HTTP Host header).

1. Enable the ingress addon (Minikube):

```bash
minikube addons enable ingress
```

2. Get Minikube IP (or use the LoadBalancer IP if available):

```bash
minikube ip
# or, if using a cloud LB: kubectl get svc library-sys-api-gateway -n library-system
```

3. Add a hosts entry on your machine (requires sudo) replacing <MINIKUBE_IP>:

```bash
echo "<MINIKUBE_IP> library.com" | sudo tee -a /etc/hosts
```

4. Verify the ingress is routing to the API Gateway and that the gateway forwards to services:

```bash
# after hosts entry, test with curl
curl http://library.com/books

# or use Host header without modifying /etc/hosts
curl -H "Host: library.com" http://<MINIKUBE_IP>/books
```

5. Production note: to use a real domain, create DNS A records for `library.com` pointing at your cluster's external IP(s) or load balancer.


## 7. Troubleshooting

If deployment fails, check:
```bash
kubectl describe pod -n library-system -l app=library-sys-api-gateway
kubectl describe pod -n library-system -l app=library-sys-auth-service
kubectl describe pod -n library-system -l app=library-sys-book-service
kubectl describe pod -n library-system -l app=library-sys-borrow-service
```

## Shared volume (logs/data) verification

This project includes a PVC (`library-sys-shared-pvc`) mounted at `/shared/logs` in the `api-gateway` and `book-service` pods. Both deployments also include a lightweight `busybox` sidecar that writes a test file on startup.

Apply the PVC and updated deployments (if not already applied):

```bash
kubectl apply -f k8s/shared-pvc.yaml
kubectl apply -f k8s/book-service.yaml
kubectl apply -f k8s/api-gateway.yaml
```

Verify the pods are running:

```bash
kubectl get pods -n library-system
```

Check the files written by the sidecars (replace `<POD>` with an api-gateway or book-service pod name):

```bash
kubectl exec -n library-system -it <POD> -- cat /shared/logs/api.txt
kubectl exec -n library-system -it <POD> -- cat /shared/logs/book.txt
```

You can also write a file from one pod and read it from another to demonstrate sharing:

```bash
kubectl exec -n library-system -it $(kubectl get pod -n library-system -l app=library-sys-api-gateway -o jsonpath='{.items[0].metadata.name}') -- sh -c "echo hello > /shared/logs/from-api.txt"
kubectl exec -n library-system -it $(kubectl get pod -n library-system -l app=library-sys-book-service -o jsonpath='{.items[0].metadata.name}') -- cat /shared/logs/from-api.txt
```

Note: Minikube uses a single node by default; `ReadWriteOnce` PVCs work for sharing on that node. For production clusters with multiple nodes, prefer a storage class that supports `ReadWriteMany`.

