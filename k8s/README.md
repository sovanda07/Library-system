# Kubernetes deployment for the library system

## 1. Build and push container images

The manifests use a `library-sys-` prefix so they are less likely to collide with other team deployments in the same cluster. If you need a different prefix, replace it in the YAML files before applying them.

From the project root, build the images and push them to a registry such as Docker Hub:

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

Replace the image values in the deployment YAML files with the exact image names you pushed.

## 2. Apply the manifests

Before applying, update the secret values for your environment:

```bash
kubectl create secret generic library-secrets -n library-system \
  --from-literal=JWT_SECRET='<your-secret>' \
  --from-literal=MONGO_URI='<your-mongodb-atlas-uri>'
```

Then apply the manifests:

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

## 3. Verify the rollout

```bash
kubectl get pods -n library-system
kubectl get svc -n library-system
kubectl logs -n library-system deploy/api-gateway
```

## 4. Access the app

If you are using a cloud provider with a load balancer, open the external IP of the api-gateway service:

```bash
kubectl get svc api-gateway -n library-system
```
