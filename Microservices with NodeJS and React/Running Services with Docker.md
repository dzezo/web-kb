### Docker

With docker we can create **Docker container**. Docker container is like isolated computing environment, it contains everything that is required to run one single program.

Why Docker?

1. Running our app right now makes big assumptions about our environment. For example we are making assumption that npm and node are installed on our local machine.
2. Running our app requires precis knowledge of how to start it (npm start)

Docker solves both these issues. Containers wrap up everything that is needed for a program + how to start and run it.
For example we can wrap up npm and node in this isolated computing environment and we are going to include information within that container on how we can start up that program.

### Kubernetes

Kubernetes is a tool for running a bunch of different containers together. We give it some configuration to describe how we want our containers to run and interact with eachother.

With kubernetes we create **kubernetes cluster**. Kubernetes cluster is a set of different virtual machines, these vm's are reffered to as **nodes** and they are all managed by something called **master**. Master is program that manages everything in the cluster.

We are going to tell kubernetes to run some program for us, and when we do is its going to take our program and then more and less randomly assign it to be executed by one of this nodes.

To tell kubernetes we are going to create some configuration files that are going to provide some explict directions to kubernetes on what we want to do, for example:

1. Run 2 copies of Posts service
2. Allow copies of Posts to be accessible from network.

This configuration file is then fed to master. Master attempts to create two different copies of Posts services wrapped up in a **Docker container** , these containers are going to then be assigned to two different vms.

Communication between this 2 copies is done by shared communication channel provided by Kubernetes, so instead of teaching our Event-bus service how to communicate with each vm, we can configure it to communicate with this shared communication channel and request will be forwared properly.
