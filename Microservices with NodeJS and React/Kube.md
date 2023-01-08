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
