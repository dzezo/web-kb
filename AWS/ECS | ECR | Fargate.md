# ECS (Elastic Container Service)

## Launch Types

**When you launch Docker Containers** on AWS, **you are launching** what is called **ECS Task on ECS Cluster**.

ECS Cluster is made of things, in case of **EC2 Launch Type** these things are EC2 instances. If you use ECS Cluster with EC2 Launch Type you must provision and maintain infrastructure yourself. These EC2 instances must run ECS Agent to register in ECS Cluster. When you start ECS tasks AWS is going to take care of starting and stoping containers.

There is a second launch type called **Fargate Launch Type**. With this lauch types there are no EC2 Instances to manage because its all serverless. You just create task definitions and AWS just runs ECS Tasks for you based on CPU/RAM you need. This means that whenever we want Docker Container to run it's simply going to run somewhere. To scale you just increase number of EC2 tasks, no more EC2 instances.

## IAM Roles

If you are using EC2 Launch Types you need to create **EC2 Instance Profile**. This profile is going to be used by ECS agents to make API calls to ECS service, to send container logs to CloudWatch, pull docker image from ECR and reference sensitive data in Secrets Manager or SSM Parameter Store.
If you want your tasks (containers) to communicate with AWS you need to set **ECS Task Role**.

## Load Balancer Integration

You can place load balancer in between ECS tasks and users and it works for both launch types. Application Load Balancer and Network Load Balancer are both supported for both launch types while Classic Load Balancer is not recommended and only supported for EC2 Launch Type.

## Data Volumes

If you want persistent data storage you can mount EFS onto ECS taks and they are going to share the same data across any AZ.

## ECS Auto Scalling

ECS uses AWS Application Auto Scaling to automatically increase or decrease number of ECS tasks. We have **3 metrics we can scale on** using this service:

1. ECS average CPU utilization
2. ECS average Memory utilization (Scale on RAM)
3. ALB request count per target

You can set up **3 kinds of auto scaling**:

1. Target tracking - scale based on target value for specific CloudWatch metric
2. Step scaling - scale based on specified CloudWatch alarm
3. Scheduled scaling - scale based on specified date/time

**Scaling your ECS Service at task level is not equal to scaling your cluster of EC2 instances** (if you are using EC2 Launch Type), that's why its so much easier to setup autoscaling with Fargate.

If you are using EC2 Launch Type and you want to scale your instances to accomodate ECS service scalling you have following options:

- Auto Scaling Group - Use ASG to scale your EC2 instances
- ECS Cluster Capacity Provider - Capacity provider is paired with ASG and as soon as you lack capacity to launch new tasks, it's going to automatically scale your ASG.

## ECS Rolling Updates

When you are updating ECS service from v1 to v2, we can control how many tasks can be started and stoped, and in which order.

We control task number by specifing minimum healthy percent (0 - 100) and maximum percent (100 - 200). Maximum percent stands for how many new tasks we can create.

Example Min 50%, Max 100%

1.  v1, v1, v1, v1 (we can terminate two)
2.  v1, v1 (we are at minimum, we can add two)
3.  v1, v1, v2, v2 (we are at maximum, we can terminate two)
4.                                    , v2, v2 (we are at minimum, we can add two)
5.  v2, v2, v2, v2 (rolling update completed)

## ECS Solutions Architectures

### Tasks invoked by Event bridge

Client uploads object to S3 bucket which is connected to AmazonEventBridge. PutObject event gets sent to event bridge which is configured to run ECS task in our Fargate cluster. Fargate launches new task with ECS Task Role that give task access to S3 and DynamoDB, after object is processed it is saved into DynamoDB.

### Tasks invoked by Event bridge schedule

You can schedule rule to be triggered every 1 hour. This rule is going to run ECS task for us in Fargate cluster. ECS task can for example do some batch processing on some objects in AWS S3.

### SQS Queue

We can have ECS service polling for messages and creating tasks using ECS Service Auto Scalling.

## Task definitions

Task definitions are metadata in JSON form to tell ECS how to run a Docker container. It contains crucial informations, such as:

- Image name
- Port binding for container and host
- Memory and CPU required
- Env variables
- Networking information
- IAM Role
- Logging configuration (ex CloudWatch)

**You can define up to 10 containers in a Task definition**.

### Load balancing

If you have load balancing and you are using EC2 Launch Type, then you are going to get **Dynamic Host Port Mapping** if you define only container port in task definition.
For example, we are running ECS tasks and all of them have container port set to 80 and host port set to zero. In this case host port is going to be random (dynamic). So it's difficult for ALB to connect to ECS task because port is changing. But ALB when linked to ECS service knows how to find correct port thanks to **DHPM** (CLB doesn't support this). **EC2 instance security group must allow any port from ALB security group**.

If you have load balancing and you are using Fargate Launch Type, then each task is going to get its own private IP address through Elastic Network Interface (ENI), and each ENI is going to have same container port 80. ALB is going to connect to all Fargate tasks on same port. ECS ENI security group needs to allow port 80 from the ALB.

### IAM Roles

**IAM Roles are assigned per task definition**.

### Environment variables

Your task definitions can have environment variables and they can come from multiple places:

- Hard coded - set them within task definition (fixed non secret URL)
- SSM Parameter Store - sensitive variables (fetched and injected in runtime)
- Secrets Manager - sensitive variables (fetched and injected in runtime)

There is one more option, to load environment variables files from S3 bucket.

### ECS Data volumes

Task definition can define 1 or more containers, and you would do that because sometimes you need side containers (side cars) to help with loggin, security, monitoring... These side cars may require you to share data with main (app) containers, in that case you need to mount data volume onto both containers.

If you are using EC2 Tasks then shared storage is EC2 instance storage, so data is tied to the lifecycle of EC2 instance.
If you are using Fargate Tasks then shared storage is ephemeral storage, so data is tied to container(s) using them.

## Task Placements

With EC2 Launch Type you have to think about where to place a new task, because each task requires CPU, memory and port. To assist with this, you can define **task placement strategy** and **task placement constraint**.

Task placement stategies are **best effort**. When ECS places tasks, it uses following process:

1. Finds instances that satisfy CPU, memory and port requirements in task definition
2. Finds instances that satisfy task placement constraints
3. Finds instances that satisfy task placement strategies
4. Selects instance

### Task placement startegies

- Binpack - Tries to fill up a host as much as possible before moving on to the next one. This minimizes number of instances in use (cost saving)
- Random - Places tasks randomly
- Spread - Places tasks evenly based on some specified value. One value example is `attribute:ecs.availability-zone` which tells ECS to spread tasks evenly across all AZs

**You can mix strategies**.

### Task placement constraints

- distinctInstance - place each task on different instance
- memberOf - places task on instances that satisfy expression. Expressions are written in CQL (Cluster Query Language), example tells ECS to only place tasks on t2 instances:
  ```json
  "placementConstraint": [
    {
      "type": "memberOf",
      "expression": "attribute:ecs.instance-type =~ t2.*"
    }
  ]
  ```

## ECR (Elastic Container Registry)

It is used to store and manage Docker images on AWS (like DockerHub). With ECR you have two options, to store images privately just for your account, or to publish them publicly to ECR gallery.
ECR is fully integrated with ECS, backed by S3 and supports image vulnerability scanning, versioning, tags...

**Access to ECR is protected, so you need to set IAM Role for your instances**.

To allow Docker CLI on your machine to connect to your private repository on AWS you need to pipe ECR login command to docker login.

```bash
# get-login-password will return password
# this password is going to be used with AWS username to login into your ECR registry
aws ecr get-login-password --region {region} | docker login --username AWS --pasword-stdin {aws_account_id}.dkr.ecr.{region}.amazonaws.com
```

After you login you can do docker commands

```bash
# Push
docker push {aws_account_id}.dkr.ecr.{region}.amazonaws.com/demo:latest
# Pull
docker pull {aws_account_id}.dkr.ecr.{region}.amazonaws.com/demo:latest
```

## Copilot

Copilot is CLI tool to build, release and operate production-ready containerized apps. It helps you focus on building rather than setting up your infrasturcture. All infrastructure complexity (ECR, ECS, ELB, VPC...) is done for you by Copilot. You just need to use CLI or YAML to describe architecture of your application and instruct Copilot to containerize your applications and deploy them to ECS, Fargate or App Runner.

## EKS (Elastic k8s Service)

EKS allows you to launch managed Kubernetes clusters on AWS. This is an alternative to ECS, because k8s is open-source and therefore used by many other cloud providers.
EKS supports two launch modes:

1. EC2 - deploy worker nodes
2. Fargate - deploy serverless containers

EKS breakdown:

- EKS Node - EC2 Instances, can be managed by ASG
  - Managed Node Groups - EKS creates and scales your nodes. Supports On-Demand or Spot instances
  - Self-Managed Nodes - You need to create nodes, register them to EKS cluster and manage them by ASG. Supports On-Demand or Spot instances
  - Fargate - There are no nodes, everything is hidden from you.
- EKS Pod - similar to ECS Task

You can attach data volumes to your EKS cluster. For this you need to specify **StorageClass** manifest on your EKS cluster, this leverages **Container Storage Interface** (CSI) compliant driver. You have support for: EBS, EFS (only storage class that works with Fargate), FSx for Lustre and FSx for NetApp ONTAP.
