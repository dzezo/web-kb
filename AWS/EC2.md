# EC2

## Setting up billing budget

Under **Billing Management Console** you can create a **Budget**. Budget will help you track your costs and send alerts if you are about to hit its limits.

## Basics

EC2 stands for Elastic Compute Cloud and this is a way to do Infrastructure as a Service (IaaS) on AWS.
EC2 is not just one service it is composed of many things:

- Renting virtual machine or **EC2 Instance**
- Storing data on virtual drives or **EBS volumes**
- Distribute load across machines (**ELB**)
- Scalin services using auto-scaling group (**ASG**)

## EC2 sizing and configuration

What we can choose for virtual machines that we rent on EC2:

- OS: Linux, Windows or MacOS
- How much compute power & cores (**CPU**)
- How much memory (**RAM**)
- How much storage space
  - Network attached (**EBS & EFS**)
  - Hardware attached (**EC2 Instance Store**)
- Network
  - Speed of the card
  - Public IP address
- Firewall rules (**Security Group**)
- Bootstrap script (configure at first launch) (**EC2 User Data**)

## EC2 User Data

It is possible to bootstrap our instances using _EC2 User data_ script. This script will only run once when instance starts and therefore is usefull for boot tasks such as:

- Installing updates
- Installing software
- Downloading common files from the internet

It is important to note that **commands** you have in this script **will have root priviledges**.

## EC2 Instance Types

AWS has the following naming convention: `m5.2xlarge`

- instance class: `m` means _general purpose_ instance
- generation: `5` when AWS improves hardware they release new generation of instances
- size: `2xlarge` size within instance class, with bigger size comes more memory, cpu power etc.

### General Purpose

This type of EC2 instance is great for a diversity of workloads such as web servers or code repositories, and it has good balance between compute, memory and networking.

### Compute Optimized (C - Series)

These are great for compute-intesive tasks that require high performance processors.

- Batch processing workloads
- Media transcoding
- High performance web servers
- High performance computing (HPC)
- Scientific modeling and ML
- Dedicated gaming servers

### Memory Optimized (R - Series)

These are great for workloads that process large data sets in memory.

- Hosting in-memory databases, like redis
- Distributed web scale cache stores
- Applications performing real-time processing of big unstructured data

### Storage Optimized

These are great for storage-intensive tasks that require high read and write access to large data sets on local storage

- High frequency online transaction processing (OLTP) systems
- Relational & NoSQL databases
- Data warehousing applications
- Distributed file systems

## Security Groups

**Security Groups** are like firewall for EC2 Instances they **control inbound and outbound traffic**. Security groups can only contain allow rules (meaning either they allow or disallow traffic), and they can reference IP addresses or other security groups.

They regulate:

- Access to Ports
- Authorized IP ranges (IPv4 and IPv6)
- Control inbound network (from others to instance)
- Control outbound network (from instance to others)

Good to know

- Security group **can be attached to many instances**, and one **instance can have many security groups**
- Security group is **locked into region/VPC**
- **Security group lives outside of EC2** (if traffic is blocked **EC2 is unaware**)
- All **inbound traffic** is **blocked** by default
- All **outbound traffic** is **allowed** by default
- If your application is not accessible (times out), then its a security group issue, unless you get `connection refused` error, then it's application issue
- It is good to maintain one separate security group for SSH

### Referencing other security groups

This comes very handly when you are working with load balancers and other EC2 instances, since you can authorize other security groups, so whenever instance with authorized security group tries to connect it will succeed. This can help you not to think about IP addresses.

### Ports to know

- 22 = SSH (Secure Shell) - log into Linux instance
- 21 = FTP (File Transfer Protocol) - upload files into a file share
- 22 = SFTP (Secure File Transfer Protocol) - upload files using SSH
- 80 = HTTP - access unsecured websites
- 443 = HTTPS - access secured websites
- 3398 = RDP (Remote Desktop Protocol) - log into Windows instance

## SSH

SSH allows you to control a remote machine through command line.

To connect to our EC2 instance we can do `ssh ec2-user@<public IPv4 address>`, reason we are doing `ec2-user` is because Amazon Linux 2 AMI has one user already set up for us. If we execute this function without specify SSH key we are going to get authentication error.
To fix this we need to reference `.pem` file we downloaded from AWS by running `ssh -i <keysName>.pem ec2-user@<public IPv4>`, note that for this to work we need to execute this command inside directory where keys are located (or specify their exact path).
When we execute this we might get another warning (UNPROTECTED PRIVATE KEY FILE), we need to change access priviledges for this `.pem` file, run `chmod 0400 <keysName>.pem` and run previous command again.

To exit instance you can type `exit` or press `shift+G`

Side note: If you are using Amazon Linux 2 AMI OS your EC2 instance will come with AWS CLI, so you can use `aws` commands right away.

### EC2 Instance Connect

This is browser based SSH alternative. You can start this by selecting your EC2 instance on AWS and clicking Connect button, there you will find option to use EC2 Instance Connect.

## Purchasing options

- On-Demand Instances - short workload, predictable pricing, pay by second
  - has the highest cost but no upfront payment
  - you have no commitment
  - **recommended:** short-term un-interrupted workload
- Reserved (1 - 3 years)
  - Reserved Instances - long workloads
    - You reserve specific instance attributes (type, region, tenency, OS)
    - Reservation period - 1 or 3 years (more discount for more years)
    - Payment options - upfront, partial upfront, no upfront (the more you pay the greater is the discount)
    - Reserved Instance Scope - Regional or Zonal
    - **recommended:** steady usage (think of databases)
    - bonus: _you can buy and sell in the Reserved Instance Marketplace_\*
  - Convertible Reserved Instances - long workloads, and you can change your instance type
    - You can change EC2 instance type, family, OS, scope and tenancy
- Saving Plans (1 - 3 years) - instead of commiting to instance you can commit to how much money your going to spend
  - You commit to certain type of usage (10$/hour 1 or 3 years), usage beyond is billed at the on-demand price
  - You are locked into specific instance family and AWS region, but you are flexible on: size, os and tenancy(Host, Dedicated, Default)
- Spot Instances - short workloads, cheap and you can lose instances!
  - You define max price you are willing to pay
  - You lose your instance if your max price is lower than current spot price
  - **recommended:** jobs resilient to failure: batch jobs, data analysis, image processing... **Not suitable for critical jobs and databases**!
- Dedicated Hosts - book entire physical server, control instance placement
  - Gives you visibility into lower level hardware
  - You can add capacity using an allocation request
  - Useful for software that have complicated licensing model (BYOL), or companies that have strong regulatory or compliance needs.
- Dedicated Instance - no customers will share your hardware
  - Runs on hardware dedicated to you
  - May share hardware with other instances in same account
  - No control over instance placement after restart
- Capacity Reservations
  - Reserve **On-Demand** instances capacity in a specific region
  - You always have access to EC2 capacity when you need it
  - No time commitment (create/cancel anytime)
  - No billing discount unless you combine it with Savings Plan
  - You are charged at On-Demand rate whether you run instances or not
  - **recommended:** short-term, uninterrupted workloads that needs to be in specific AZ
