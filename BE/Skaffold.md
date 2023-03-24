# Skaffold

Config file for Skaffold is placed in root project directory with name `skaffold.yaml`

Things written in skaffold config file are not consumed by our cluster because this tool runs outside of cluster.

## Manifest

This tells Skaffold that there is a collection of different config files intended for k8s. By adding this manifest line, we are telling Skaffold that we want to watch all these yaml files

```yaml
deploy:
  kubectl:
    manifests:
      - ./infra/k8s/*
```

Any time change occurs Skaffold is going to apply it to our k8s cluster
So no more `kubectl apply -f` whenever we change a file

One thing to note whenever we start Skaffold up `skaffold dev` it is going to apply all these configs and whenever we stop it is going to remove them

## Build

Whenever Skaffold rebuilds an image by default it attempts to push it to DockerHub, this config prevents that.

```yaml
local:
  push: false
```

### Artifacts

Artifacts section tells Skaffold that there is something in our project that it needs to maintain

```yaml
artifacts:
  - image: dzzo/client
    context: client
    docker:
      dockerfile: Dockerfile
    sync:
      manual:
        - src: "src/**/*.js"
          dest: .
```

This config tells that there is some pod that is running code from `client` directory, and whenever some changes happen in this directory Skaffold needs to update that pod.

There are two ways in which Skaffold is going to try and update our pod:

**(1)** Whenever we make changes to some javascript file its going to take that file and copy it inside our pod.

```yaml
sync:
  manual:
    - src: "src/**/*.js"
      dest: .
```

**(2)** If any other file gets changed that does not conform to rules above Skaffold is going to rebuild entire image.

## Example

```yaml
apiVersion: skaffold/v2alpha3
kind: Config
deploy:
  kubectl:
    manifests:
      - ./infra/k8s/*
build:
  local:
    push: false
  artifacts:
    - image: dzzo/client
      context: client
      docker:
        dockerfile: Dockerfile
      sync:
        manual:
          - src: "src/**/*.js"
            dest: .
    - image: dzzo/comments
      context: comments
      docker:
        dockerfile: Dockerfile
      sync:
        manual:
          - src: "*.js"
            dest: .
    - image: dzzo/event-bus
      context: event-bus
      docker:
        dockerfile: Dockerfile
      sync:
        manual:
          - src: "*.js"
            dest: .
    - image: dzzo/moderation
      context: moderation
      docker:
        dockerfile: Dockerfile
      sync:
        manual:
          - src: "*.js"
            dest: .
    - image: dzzo/posts
      context: posts
      docker:
        dockerfile: Dockerfile
      sync:
        manual:
          - src: "*.js"
            dest: .
    - image: dzzo/query
      context: query
      docker:
        dockerfile: Dockerfile
      sync:
        manual:
          - src: "*.js"
            dest: .
```
