# Route 53

53 is DNS port, hence the name Route 53

## DNS

URL terminology example `http://api.www.example.com`

`.` - invisible trailing dot is root
`.com` - TLD (Top Level Domain)
`example.com` - SLD (Second Level Domain)
`www.example.com` - Sub Domain
`api.www.exampple.com` - FQDN (Fully Qualified Domain Name)
`http` - Protocol

How does DNS work when you want to access your freshly created web server at `example.com`?
It will first ask local DNS server provided by your ISP (Internet Service Provider) if its not found there, it will ask Root DNS Server.
Root DNS Server (managed by ICANN) can't provide you with exact IP address of your web server but it knows address of server that manages `.com`, so it will return IP adress of TLD DNS Server.
TLD DNS Server (managed by IANA, branch of ICANN) also can't provide exact IP address of your web server but it knows server that manages `example.com`, so it will return IP adress of SLD DNS Server
SLD DNS Server (managed by Amazon for example) knows exact address of your web server and will return it to your local DNS server.
Local DNS Server will store it in cache before returning IP Address.

## Overview

Route 53 is highly available, scalable, fully managed and authoritative DNS. Authoritative DNS means that customer (you) can update DNS records.
Route 53 is also a Domain registrar.

### DNS Records

In Route 53 you are going to define a bunch of DNS records. This **records tell how you want to route traffic to specifc domain**.

Each record contains:

- Domain / Sub Domain name - example.com
- Record Type - A / AAAA / CNAME / NS (and more advanced)
- Value - 12.34.56.78
- Routing Policy - how Route 53 responds to queries
- TTL - amount of time the record is cached at DNS resolvers

### Record Types

- A - maps hostname to IPv4
- AAAA - maps hostname to IPv6
- CNAME - maps hostname to another hostname
  - target is a domain name which must have A or AAAA records
  - can't create CNAME record for the top node of DNS namespace (you can create CNAME for www.example.com, but not for example.com)
- NS - Name Servers for the Hosted Zones
  - IP addresses or domain names that can respond to DNS queries for your hosted zone

### Hosted Zones

Hosted zone is container for records that define how to route traffic to a domain and its subdomains. There are two types of hosted zones public and private.

**Public hosted** zones contain **records that specify how to route traffic on the internet**, while **private hosted zones do the same but within VPC** (Virtual Private Cloud)

### Record TTL

Whenever user sends DNS request to Amazon Route 53 he will get IP address response with TTL. This **TTL tells client to cache that IP address for that period of time** (ip address won't change so its safe to cache it for at least that amount of time).
TTL is important to set if you set TTL to be too low (e.g. 60 sec) clients will make more requests to Route 53 which will cost you more money.

### CNAME vs Alias

- CNAME
  - Points hostname to any other hostname (app.mydomain.com -> example.example.com)
  - **only works for non root domain** like app.mydomain.com, it won't work for mydomain.com
- Alias
  - Points hostname to AWS resource, like ALB hostname
  - **works for both root and non root doman** which means that you can use mydomain.com
  - It has native health check
  - Free of charge

#### Alias Records

When you map your domain to some AWS resource any change in the resource IP address will be recognized automatically. Unlike CNAME, it can be used for the top node of DNS namespace (Zone Apex), e.g. example.com
Alias record is always of type A/AAAA. TTL for Alias record is set automatically by Route 53.

Targets:

- ELB
- CloudFront
- API Gateway
- S3 Websites - not bucket!
- Route 53 Record
- Elastic Beanstalk

**You cannot set an Alias record for an EC2 DNS name**

### Routing Policy

#### Simple

They typically route traffic to a single resource, clients make a request to Route 53 and it responds with A record. Route 53 can respond with multiple A records and in that case client chooses one randomly.

#### Weighted

You can control % of traffic that goes to each specific resource, use cases for this can be load balancing between regions, testing new application version or something else.
If you assign weight 0 to a record, Route 53 will stop sending traffic to that resource, but if you set weight 0 to all your records traffic will be distributed equally.

#### Latency-based

Redirect to resource that has the least latency, this is helpful when latency is a priority.

#### Failover

This type of routing requires health check on primary resource (EC2 Instance for example), if that resource fails for some reason, health check will fail aswell which is going to tell Route 53 to route traffic to secondary (disaster recovery) resource (another EC2 Instance for example).

#### Geolocation

This routing is based on user location. You can specify continent, country or state and if there is overlaping, most precise location is selected, you should create default record in case there is no match.

Uses cases: website localization, restrict content distribution, load balancing...

#### Geoproximity

This policy routes traffic based on geographic location of both user and resource. You can specify something called bias (1 to 99 or -1 to -99) on your resource if you want to shift focus to it more, the higher the bias the more traffic will be sent and vice versa.

To use this feature you must use Route 53 Traffic Flow

#### IP-based Routing

This policy routes traffic to resource based on clients CIDRs (203.0.113.0/24, first 24 bits are static)

#### Multi-Value

This routing policy is used when you want to route traffic to multiple resources, but unlike simple routing you can add health check and only resources that pass health check will be returned.
Up to 8 healthy records can be returned for each query.

### Health Checks

We have three types of health checks:

1. Checks that monitor an endpoint (application, server, other AWS resource)
2. Checks that monitor other health checks (Calculated Health Checks)
3. Checks that monitor CloudWatch alarms

#### Monitor an endpoint

About 15 global health checkers will check endpoint's health. You can configure things like checking interval and health threshold which is 3 by default, this means that if 3 health checkers report endpoint as healthy, Route 53 will consider it healthy.
Health checks pass only when endpoint responds with 2xx and 3xx status codes, and they can be configured to pass/fail based on the text in the first 5120 bytes of the response.

If you want to benefit from health checkers you need to enable health checkers ip addresses (on your ELB for example).

#### Calculated Health Checkers

This is used to combine results of multiple health checks into single one. Conditions you can use to combine these health ches can be: OR, AND or NOT.
You can monitor up to 256 child health checks, and specify how many need to pass to make the parent pass.

#### Monitor CloudWatch alarm

You can create a CloudWatch metric and associate CloudWatch alarm to it, then you can set health checker to check this alarm. This can be useful if you want to check resource within private VPC.

## Domain Registrar vs DNS Service

You can buy or register your domain with a Domain registrar (GoDaddy, Amazon Registrar) by paying annual charges. Domain registrar usually provides DNS service to manage your DNS records. If you buy domain outside of Amazon you can still use it you just need to configure its Nameserver to point to Amazon Hosted Zone.
