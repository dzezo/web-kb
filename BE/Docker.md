## Docker

With docker we can create **Docker container**. Docker container is like isolated computing environment, it contains everything that is required to run one single program.

### Why Docker?

1. Running our app right now makes big assumptions about our environment. For example we are making assumption that npm and node are installed on our local machine.
2. Running our app requires precise knowledge of how to start it **(npm start)**

Docker solves both these issues. Containers wrap up everything that is needed for a program + how to start and run it.
For example we can wrap up npm and node in this isolated computing environment and we are going to include information within that container on how we can start up that program.

### What is Docker

**Docker Client (Docker CLI)** - Tool that we are going to issue commands to.

**Docker Server (Docker Daemon)** - Tool that is responsible for creating images, running containers, etc...

**Docker Image** - Docker image is a single file with all the dependencies and configurations required to run a program.

**Docker Container** - Instance of an image. So essentially it runs a program with its own isolated set of hardware resources.

**Example:**

`docker run hello-world` This command means that we want to start _new container_ using the image `hello-world`, this image has tiny program in it whose sole purpose is to print a message.

It all starts with _Docker Client_ (Docker CLI) sending user commands to _Docker Server_. First thing that _Docker Server_ does is check if that image exists locally (looks into something called Image Cache), if no matches were found _Docker Server_ reaches to _Docker Hub_ (repository of free public images). Since hello-world is available on _Docker Hub_ it gets downloaded and stored into Image Cache. _Docker Server_ then takes that single file loads it into memory, creates a container and runs a single program inside of it.

### Container Lifecycle

`docker run`
Combination of two commands `docker create` and `docker start`

`docker run <container_id>`
Command creates and starts a container from _Docker Image_.

Docker Image is comprised of two major parts **File System Snapshot** and **Startup Command**

`docker create <container_id>`
Command creates a container. When we create a container we are just preparing **file system snapshot** to be used. This command returns **container_id**.

`docker start <container_id>`
Command **starts/restarts** a container. When we start a container that is when we execute **startup command** portion of Docker Image. This command returns **container_id**, if you specify **-a** flag it will watch and print output of a container.
If for example we want to know output of a container and we forgot to add **-a** flag to start command, we can salvage this situation with `docker logs <container_id>` command, since stoping and starting container again might be expensive.

`docker stop <container_id>`
Command to stop a container. This command send **SIGTERM** (Terminate signal) to a running process, which tells process to shutdown on its own terms. This is so that process can do a little bit of clean-up before shutdown, since many programs allow you to listen for **SIGTERM**.
**_Fun Fact:_** If you issue `docker stop` command and running process doesn't exit within 10 sec. Docker will execute `docker kill` command.

`docker kill <container_id>`
Command stops a container with **SIGKILL** which tells process to shutdown immediately.

Containers with status **Exited** are not running and are essentially only taking disk space. To delete stopped containers use `docker system prune` command. This command will also delete all downloaded images.

### Multi-Command Containers

Lets say that we have redis installed on our local machine. We can use `redis-server` to start up redis in one command window, and then use `redis-cli` to poke around redis in another.

How can this be accomplished with Docker since we can only issue one command at the start?

In this specific case we can start redis server as startup command of our redis image and thats it. We can't open another tab and try redis-cli that command would not get recognized since it's outside of that container.

`docker exec -it <container_id> <command>`
Command that allows us to execute additional command in **running** container. In this case we can do `docker exec -it 0231a3b1c24 redis-cli` and we are going to see redis-cli interface.

Running this exact command without **-it** flag would start redis-cli but would not display redis-cli interface, why is that?

Every single process that runs in Linux (Docker is executed on Linux kernel no matter what) has 3 communication channels: **STDIN**, **STDOUT** and **STDERR**, these channels are responsible for process input/output.

Flag **-it** is actually short version of **-i -t** where
**-i** means that you want your terminal keyboard to be connected to running process **STDIN**,
**-t** formats the text you get back in more human readable fashion.

What we can do also is open cmd inside a container with command `docker exec -it <container_id> sh`. Once we do that we can do things like `cd` and `ls` as well as run `redis-cli`

In this case **sh** is a program that is being executed inside a container, sh (shell) is a command processor (_something that allows us to type commands in and get them executed_).

### Container Isolation

It is important to remember that container **do not** share file system.

### Creating Docker Images

To create docker image we need to create Dockerfile that is going to tell docker how to create an image.

To create dockerfile, open any editor and create new filed named **Dockerfile** exactly, first letter is capital and there is no extension. To build this docker file run `docker build` command.

The three most important instructions within docker file are:

**FROM** - is used to specify which docker image we want to use as a base.

**RUN** - is used to execute some command while we are preparing some custom image.

**CMD** - specify what should be executed once our image starts a brand new container.

### Dockerfile build flow

```Dockerfile
FROM alpine
RUN apk add --update redis
CMD ["redis-server"]
```

- FROM
  - Download alpine image
- RUN
  - Get image from previous step
  - Create container out of it
  - Run alpine package manager in it
  - Take snapshot of that container's FS
  - Shut down that container
  - Get image ready for next insturction
- CMD
  - Get image from previous step _(has redis on it)_
  - Create container out of it
  - Tell container it should run `redis-server` when started
  - Shut down that container
  - Get image ready for next instruction
- No more steps -> Output is the image generated from previous step.

### Tagging an image

Whenever we build Dockerfile we get image ID and then use `docker run <image_id>` to start a container.

What we can do is assign name to that image so that it becomes easier to use and we do that during build time like this: `docker build -t <tag_name> <directory_path>`

Convetion for naming your images is `<docker_id>/<repo_project_name>:<version>` so it can be something like `dzzo/redis:latest`

### PORT forwarding

Containers are isolated units they have their own piece of memory, cpu and network.

Which means that they are unaware of what happens outside of them so in order to forward some network request into a container you need to do port forwarding. Port forwarding is something that is done when you run docker image, command for that is `docker run -p <outside_port>:<inside_port> <image_id>`

One thing to note is that there is no constraint on outgoing requests that originate from container, only inbound requests are constrained.
