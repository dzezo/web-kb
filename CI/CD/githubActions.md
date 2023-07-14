```yaml
name: test ## Workflow name

on: ## When workflow is run
  pull_request

jobs:
  build:
    runs-on: ubuntu-latest ## start VM
    steps:
      - uses: actions/checkout@v2 ## take all code from our project
      ## test:ci is command that runs all test once, we dont want to watch like in dev mode
      - run: cd auth && npm install && npm run test:ci
```

### Testing microservices

If our project consists of microservices there are two ways in which we can test every service. One is to add more commends in run array, this will execute tests in sequence which is slow. Another approach would be to create different workflow for each of our services.

### Selective test execution

In order to run tests for service where changes have been made we need to make following change:

```yaml
on:
  pull_request:
    paths:
      - "auth/**" ## check if file changes are inside auth directory
```

### Deployment (Digital Ocean)

- Generate new token.
- `doctl auth init [token]`
- `doctl kubernetes cluster kubeconfig save ticketing`
  - `kubectl config view` to list all contexts
  - `kubectl config use-context [context-name]` switch to another context

### Deployment plan

#### Services workflow

- build new image
- push to docker hub
- update deployment (reach to cluster)
- if something is crashing you can use
  - `kubectl logs [pod_name]`
  - `kubectl describe pod [pod_name]`

```yaml
name: deploy-auth
on:
  push: ## whenever we close PR it counts as push
    branches:
      - master
    paths:
      - "auth/**"
jobs:
  build:
    runs-on: ubuntu-latest ## has docker pre-installed
    steps:
      - uses: actions/checkout@v2
      - run: docker build -t dzzo/auth ./auth
      - run: docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD
        env:
          DOCKER_USERNAME: ${{ secrets.DOCKER_USERNAME }}
          DOCKER_PASSWORD: ${{ secrets.DOCKER_PASSWORD }}
      - run: docker push dzzo/auth
      - uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
      - run: doctl kubernetes cluster kubeconfig save ticketing ## feeds kubectl with all information needed
      - run: kubectl rollout restart deployment auth-depl
```

#### Infra workflow

- apply all yaml files (executed at all times)
- manually add secrets into digital ocean cluster
  - `kubectl create secret generic stripe-secret --from-literal=STRIPE_KEY=[key]`
- before we can use ingress-nginx we need to run setup command
  - command for digital ocean can be found on https://kubernetes.github.io/ingress-nginx/deploy/

```yaml
name: deploy-manifests
on:
  push: ## whenever we close PR it counts as push
    branches:
      - master
    paths:
      - "infra/**"
jobs:
  build:
    runs-on: ubuntu-latest ## has docker pre-installed
    steps:
      - uses: actions/checkout@v2
      - uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
      - run: doctl kubernetes cluster kubeconfig save ticketing ## feeds kubectl with all information needed
      - run: kubectl apply -f infra/k8s
      - run: kubectl apply -f infra/k8s-prod
```

#### Buying domain name

Load balancer has an external IP Adress listed on digital ocean.

We can use namecheap to buy domain. Once we buy domain we need to setup custom DNS

- ns1.digitalocean.com
- ns2.digitalocean.com
- ns3.digitalocean.com

then in digital ocean networking we need to create records for

- A
- CNAME
