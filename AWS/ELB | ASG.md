# ELB

Load balancers are servers that forward traffic to multiple servers (e.g. EC2 instances) downstream.

Why should you use load balancer?

- Spread load across multiple downstream instances
- Expose a single point of access (DNS) to your application
- Seamlessly handle failure of downstream instances
- Do regular health checks to your instances
- Provide SSL termination (HTTPS) for your websites
- Enforce stickiness with cookies
- High availablity across zones
- Separate public from private trafic

ELB (Elastic Load Balancer) is load balancer managed by AWS. AWS will take care of upgrades, maintenance and they guarantee that it will work.
It will cost you way less to setup your own load balancer, but it will require way more effort, especially since ELB is integrated well with many AWS offerings/services.

## Health Checks

They enable load balancer to **know if instances** it forwards traffic to **are available to reply to requests**, so it is crucial. Health check is done on a port and a route (e.g. `:4567/health`), and if response is not 200 OK, then instance is unhealthy.

## Types of load balancers

- Classic Load Balancer (CLB) - deprecated
- Application Load Balancer (ALB) - HTTP, HTTPS, WebSocket
- Network Load Balancer (NLB) - TCP, TLS (secure TCP), UDP
- Gateway Load Balancer (GLB) - Operates at layer 3 (Network layer) - IP Protocol

Some load balancers can be setup as internal (private) or external (public).

## Load Balancer Security Groups

**Security group for load balancer should allow traffic** for HTTP and HTTPS **from anywhere**, but trafic to and from **EC2 instance should be restricted to communicate to load balancer** on port 80 (HTTP). So **source within security group of EC2 instance should be load balancer security group** and not IP address range.

## Application Load Balancer (ALB)

ALB is **Layer 7 only** load balancer, that means HTTP. It allows you to **route to multiple application across machines**, grouped into target groups, **or route to multiple applications on same machine** (using containers ECS).

ALB support HTTP/2 and Websockets, and you can redirect from HTTP to HTTPS on load balancer level.

### Routing tables

This load balancer supports routing tables, so that you can target specific machines (target groups) based on route.

Routing types:

- Based on path in URL (example.com/**users** & example.com/**posts**)
- Based on hostname in URL (**one.example.com** & **other.example.com**)
- Based on query strings and headers (example.com/users?**id=123**)

This makes them great fit for micro services and container-based applications

### Target Groups

Target groups can be:

- EC2 instances (can be managed by ASG)
- ECS tasks (managed by ECS)
- Lambda functions
- IP addresses - private servers on-premises

Health checks are done on target group level.

### Good to know

- You are going to get fixed host name `XXX.region.elb.amazonaws.com`
- Application servers don't see IP of client directly, true IP is inserted in the header `X-Forwarded-For`
- We can also get port and proto through `X-Forwarded-Port` and `X-Forwarded-Proto`

## Network Load Balancer (NLB)

NLB is **Layer 4** load balancer, that means TCP/UDP. This load balancer allows you to forward TCP and UDP traffic to your instances, and it can handle millions of requests per second with less latency than ALB (Application Load Balancer).
NLB has **one static IP per AZ**, and supports assigning elastic IP.

It works simlarly to ALB, it redirects traffic to target groups that can be made of EC2 instances, IP Adresses and ALB.

You can put NLB in front of ALB to get fixed IP adress, and thanks to ALB you can get all the rules for handling HTTP type of traffic, so this is a valid combination.

Health checks support TCP, HTTP and HTTPS protocols.

## Gateway Load Balancer (GLB)

GLB is used whenever you need to analyze network traffic before it reaches your application. This load balancer operates at **Layer 3** (Network layer, meaning IP packets) and it **uses GENEVE protocol on port 6081**.

GLB combines two functions **transparent network gateway** and **load balancer** that distrubtes traffic to your target group of virtual appliances. Virtual appliances can be EC2 instances or IP addresses leading to your own data center.

## Sticky Sessions (Session Affinity)

It is possible to implement _stickiness_ so that the **same client is always redirected to same instance** behind load balancer. This works by using _cookies_ for stickiness that has expiration date you can control. Most common use case is when you want to make sure user doesn't lose his session data.

To enable stickiness you need to edit attributes of your target group. Enabling this may bring imbalances to load over backend EC2 instances.

### Cookies

We have two types of cookies **Application-based** and **Duration-based**.

Application-based cookies can be further broken down into **custom cookies** and **application cookes**.
Custom cookie is created by the target (your application) and it can have any custom attributes, cookie name must be specified individually for each target group and it can't be **AWSALB**, **AWSALPAPP** or **AWSALBTG** because they are reserved.
Application cookie is created by the load balancer and cookie name is **AWSALPAPP**

Duration-based cookie is generated by the load balancer and its name is **AWSALB** for ALB or **AWSELB** for CLB. Cookie duration is set by load balancer.

## Cross-Zone Load Balancing

You have option of enabling or disabling cross-zone load balancing, when you enable this feature your traffic will be evenly distributed across all your instances regardless of availablity zone they are in.

**ALB** comes with this option **enabled by default**, and you can't turn it of on load balancer level, however you can do it on target-group level with no cost. **NLB and GLB** have this **disabled by default, and enabling costs**. **CLB has this disabled, but enabling has no cost**.

## SSL/TLS Basics

SSL certificate allows traffic between client and load balancer to be encrypted in transit (in-flight encryption), it will be decrypted and undestood only by sender and receiver.
SSL refers to Secure Sockets Layer and it is used to encrypt connections, TLS refers to (Transport Layer Security) and it is a newer verison of SSL which is mainly used today, but people still call it SSL.
SSL certificates have and expiration date and therefore must be renewed. They are issued by Certificate Authorities (CA) like: Comodo, Symantec, GoDady...

Load balancer uses X.509 certificate (SSL/TLS server certificate) and you can manage certs using ACM (AWS Certificate Manager).

When you specify HTTPS listener on load balancer:

- you must specifiy default certificate
- optionally add list of certs to support multiple domains
- clients can use SNI (Server Name Indication) to specify hostname they reach
- you can add support for legacy clients

### SNI (Server Name Indication)

SNI solves problem of **loading multiple SSL certficates onto one web server** (load balancer in our case). This is a newer protocol and it **only works for ALB, NLB and CloudFront**, it **doesn't work for CLB**.

_How it works?_ Lets say that we have two target groups `corp.com` and `example.com`, in front of them we have ALB that holds SSL certs for both of them. Now whenever client tries to connect to `corp.com` server will find correct certificate and decrypt traffic.

This allows you to have multiple target grops for different websites using different SSL certificates.

## Connection Draining

This feature has two different names:

- Connection draining - for CLB
- Deregistration delay - for ALB & NLB

This feature allows you to gracefully deal with unhealthy intance or instance de-registration. It give that instance some time to complete in-flight requests after which load balancer stops sending requests to it.
Time ranges between 1 to 3600 seconds (default is 300) and it can be disabled by setting its value to 0.

# ASG (Auto Scaling Group)

In real life load on your website and application can change up and down, and since on AWS you can quickly add or remove instances ASG allows you to automate that process.

Goal of ASG is to scale in or out. Scaling out means adding EC2 instances, while scaling in means removing them. You can specify minimum and maximum amount of running instances.
New instances can be automatically registered to load balancer and load balancer health check can be use to terminate unhealthy EC2 instances.

ASG is free and you only pay for the underlying EC2 instances.

When creating ASG you need specify launch template, min, max and initial capacity as well as scaling polices. Launch template (older "Launch configurations" are deprecated) consist of:

- AMI + instance type
- EC2 user data
- EBS volumes
- Security Groups
- SSH key pair
- IAM Roles for your EC2 instance
- Network + Subnets information
- Load balancer information

When talking about scaling policies, it is possible to scale and ASG based on CloudWatch alarms. We can set an alarm that monitors a metric like average CPU (note that metrics such as avg CPU are computed for the entire ASG), and based on that alarm we can create scale-out or scale-in policies.

## Scaling Policies

There are two types of scaling policies **dynamic** and **predictive**.

Predictive scaling policy uses ML to generate usage forecast and scale your instances acording to that.

Dynamic scaling policies can be further broken down into:

- Target Tracking Scaling - Easiest to set-up, for example you just tell ASG that you want average ASG CPU usage to stay at around 40%.
- Simple/Step scalling - You scale based on CloudWatch alarm where you specify trigger (example CPU > 70%) and how many units to add or remove
- Scheduled actions - You scale based on some known usage pattern, for example _increase min capacity to 10 at 5pm on friday_

After scaling activity happens you enter **cooldown period** (default 300 seconds). During this period **ASG will not launch or terminate additional instances** to allow metrics to stabilize.

Good metrics to scale on:

- CPU utilization
- RequestCountPerTarget - make sure number of requests per EC2 instances is stable
- Average Network In/Out

## Instance Refresh

This feature allows us to update launch template(update AMI for example) an re-create all EC2 instances based on it. When we start instance refresh we need to tell ASG minimum healthy percentage, this will slowly terminate old instances while keeping number of healthy instances above that percentage, and over time all old instances will be replaced. We can also specify warm-up time, warm-up stands for how long unitl our instance is considered ready for use.
