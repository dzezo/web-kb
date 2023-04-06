## Kubernetes

### Terminology

**Kubernetes Cluster** - A collection of nodes + master to manage them.
**Node** - A virtual machine that will run our containers
**Pod** - More or less a running container. Technically, a pod can run multiple containers.
**Deployment** - Monitors a set of pods, make sure they are running and restarts them if they crash.
**Service** - Provides an easy-to-remember URL to access running container (Pod)

### Kubernetes Config Files

K8s config file tells k8s about the different Deployments, Pods and Services (in short Objects) that we want to create. They are written in YAML syntax, and you should always store these files with project source code - they are documentation on what k8s is doing!

You can create Object\* without config files, but it should only be done for testing purposes!

```yaml
# This specifies the set of objects we want K8s to look at
apiVersion: v1
# Type of object we want to create
kind: Pod
# Config options of object we're about to create
metadata:
  # This is the name of the pod we are creating, since it only runs a single container it is named as container, but it can be anything. Once you run kubectl get pods this is the name that will appear in the first column.
  name: posts
# The exact attributes we want to apply to the object we are about to create
spec:
  # We can create many containers inside a pod
  containers:
    # Create container called 'posts'
    - name: posts
      # Exact image we want to use
      # One important thing to note, if you omit version number k8s will by default look at docker hub for image, which can result in an error if you haven't pushed that image there yet.
      image: dzzo/posts:0.0.1
      # Whether it should look for image in docker.hub, Never tells k8s to only look locally for image above.
      imagePullPolicy: Never
```

### Common k8s commands

Docker is about running individual containers while k8s is about running bunch of containers together. Once we start working with k8s we are not going to use dockers command tools anymore.

`kubectl get pods` This is the same as `docker ps`

`kubectl exec -it [pod_name] [cmd]` This is the same as `docker exec -it  [container_id] [cmd]`

`kubectl logs [pod_name]` This is the same as `docker logs [container_id]`

`kubectl delete pod [pod_name]` This is command to delete pod manually, usually used to restart a pod. This command can take up to 10 sec to execute.

`kubectl apply -f [config_file_name]` This command is used to create a new object, and it tells k8s to process config file.

`kubectl describe pod [pod_name]` Prints some debug information about running pod.

**Quick tip**: Open bashrc file and add alias to replace kubectl with k.

```
code . ~/.bashrc
```

### Deployments

In real world scenario we Deployment k8s object to create pods. This object is intended to manage a set of pods. It can be one pod and as many as 100 pods. All those pods are identical in nature, they will all be running the same config and the same container inside them.

Deployments job is to re-start pods that crash. One more neat thing that Deployment can do is change version of pods seamlessly, first by creating the same number of new version pods, then transfering management to them while sunseting old pods.

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: posts-depl
spec:
  # Number of pods we want to create running some particular image
  replicas: 1
  # Selector takes a look at all the pods that have been created.
  # Matches all pods that have label "app: posts"
  # Those are pods this Deployment is in charge of
  selector:
    matchLabels:
      app: posts
  # This is where we specify exact configuration of a Pod we want our Deployment to create.
  template:
    # This is going to be applied to Pods created by this Deployment.
    # With this we are saying that we want to have Pod with label "app: posts".
    # This is how template and selector work together.
    metadata:
      labels:
        app: posts
    spec:
      containers:
        - name: posts
          # If there is no version number on image, k8s will first look on docker hub for image.
          # That's why there is pull policy on never.
          image: dzzo/posts:0.0.1
          imagePullPolicy: Never
```

**Deployment Commands**

`kubectl get deployment` Lists all the running deployments

`kubectl describe deployment [depl_name]` Print out details about specific deployment

`kubectl apply -f [config_file_name]` Create a deployment out of config file. This will create as many pods as specified by replicas property. When you try to delete this pods manualy they will re-appear again. Only way to remove pods created by Deployment is to remove Deployment.

`kubectl delete deployment [depl_name]` Delete a deployment

**Updating Deployment**

Steps to update image used by Deployment:

- The deployment must be using the 'latest' tag in the pod spec section (effect is the same if you omit image version).
- Make an update to your code
- Build the image
- Push the image to docker hub
- Run the command `kubectl rollout restart deployment [depl_name]`

### Networking with Services

K8s object called Service provide networking between pods, we can create them through config files just like Pods and Deployments.

Services is used whenever we want to create request between pods, for example between _Event Bus_ and some service, or when we want to access some pod outside of k8s cluster.

There are a couple of Services:

**Cluster IP** - Sets up easy-to-remember URL to access a pod. Only exposes pods to other pods the cluster

**Node Port** - Makes a pod accessible from outside the cluster. Usually only used for dev purposes.

**Load Balancer** - Makes a pod accessible from outside the cluster. This is the right way to expose a pod to the outside world.

**External Name** - Redirects an in-cluster request to a CNAME url

### NodePort Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: posts-srv
spec:
  type: NodePort
  # Role of NodePort Service is to expose set of nodes(pods) to the outside world so it needs to know what pods to expose.
  # This tells it to look for all created pods that have label 'app: posts' and our Deployment created those.
  selector:
    app: posts
  ports:
    - name: posts # name for logging purposes
      protocol: TCP
      # Service port
      port: 4000
      # Pod port (application listens on this port)
      targetPort: 4000
```

There is another port that gets created once we apply this and it is called **nodePort**. **NodePort** is a port to a Node(VM) which runs this service.

For users running minikube run `minikube ip` to get local k8s cluster ip address since it won't be localhost

### Cluster IP Service

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: posts-depl
spec:
  replicas: 1
  selector:
    matchLabels:
      app: posts
  template:
    metadata:
      labels:
        app: posts
    spec:
      containers:
        - name: posts
          image: dzzo/posts
# This is yaml separator, using this we can have both Deployment and ClusterIP inside one file.
---
apiVersion: v1
kind: Service
metadata:
  name: posts-clusterip-srv
spec:
  selector:
    app: posts
  type: ClusterIP
  ports:
    - name: posts
      protocol: TCP
      port: 4000
      targetPort: 4000
```

Whenever we want to establish communication between pods, we are always going to create ClusterIP service for the pod we are trying to reach out to. Once we have created that ClusterIP service to make a request to it we are going to write url of `http://posts-clusterip-srv:4000`.

We need to go into our index.js file for our service and change those ip-adresses for this one.

### Load Balancer Services

The goal of this service is for us to have one single point of entry to our entire k8s cluster. We are then going to make sure that our FE app makes a request to that service, and we are going to place some logic inside this LB service to route requests to appropriate pods (what we are really reaching out is ClusterIP service).

**Load Balancer Service** tells k8s to reach out to its provider and provision a load balancer. Gets traffic in to a single pod.
At some point of time our cluster is going to be hosted on some cloud provider (AWS, GC, Azure), and in order to allow traffic from outside world to a specific pod inside our cluster, we need to tell our provider that we want to provision a `Load Balancer`, and we do so by creating `LoadBalancer Service`.

**Ingress or Ingress Controller** a pod with a set of routing rules to distribute traffic to other services. Problem appears when we have multiple pods that we want to access, and we don't want to put that logic inside our frontend app. And since Load Balancer can't do everything for us we need Ingress. Ingress is a pod that sits between Load Balancer and our other pods, and its task is to route trafic to appropriate pod.

### Ingress

For minikube users run `minikube addons enable ingress` this will add ingress-nginx-controller inside your cluster, after that all we need to do is feed config file to this controller in order to reconfigure its routing strategy.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ingress-srv
  # This will tell ingress-controller that we want to feed it some settings,
  # ingress-controller is constantly scanning for incoming config files and is looking for annotation like one bellow.
  annotations:
    kubernetes.io/ingress.class: nginx
spec:
  rules:
    # Inside kubernetes we can host infrastructure for multiple different apps at the same time.
    # We distinguish them by using domains like post.com
    # This means that routing startegy bellow apply only to post.com application
    - host: posts.com
      http:
        paths:
          - path: /posts
            pathType: Prefix
            backend:
              service:
                name: posts-clusterip-srv
                port:
                  number: 4000
```

One thing to note is that ingress doesn't see route methods, so POST and GET method on route /posts are the same (/posts). What we need to do is have unique paths for everything.

### Skaffold

Whenever we want to update our code we need to go through multiple steps like building the image, pushing to hub and running `rollout restart` command which can get tedeous.

Skaffold is a command line tool that enables you to make code update in a running pod, and also makes it easy to create/delete all objects tied to a project at once.

### Kubectl Contexts

In order to connect to k8s cluster on our cloud we are going to use the same `kubectl` command just with different context. Context can be thought of as different connection settings.

### K8s Secrets

Creating secret - `kubectl create secret generic jwt-secret --from-literal=JWT_KEY=1234`

There are many types of secretes we can create in k8s, _generic_ secret is all-purpose secret information.
Command above will create general purpose secret named _jwt-secret_ with one key value pair _JWT_KEY=1234_, one secret can have many key value pairs.

Getting secrets - `kubectl get secrets`

Accessing cluster secrets inside a pod can be achived with following configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-depl
spec:
  # Number of pods to create
  replicas: 1
  # Tell deployment how to find pods
  selector:
    matchLabels:
      app: auth
  # How to create each pod
  template:
    # Should match with selector above
    metadata:
      labels:
        app: auth
    # Tell pod how to behave
    spec:
      containers:
        - name: auth # Only used for logging purposes
          image: dzzo/ticketing-auth
          env:
            - name: JWT_KEY
              valueFrom:
                secretKeyRef:
                  name: jwt-secret
                  key: JWT_KEY
```

You would then use this env value inside node application like you normally would `process.env.JWT_KEY`

### Port-Forwarding with Kubectl

`kubectl port-forward [pod-name] [local-machine-port]:[pod-port]`
