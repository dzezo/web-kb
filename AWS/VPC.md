# VPC (Virtual Private Cloud)

**VPC is private network within Amazon region**. When you use AWS Cloud you use default VPC for each region that only has one public subnet for all AZs.

Within VPC you have **subnets** that **allow you to partition your network**, and they are defined **within AZ**. We have **two subnet types** at our disposal **public and private**.
Public subnet is a subnet that is accessible from the internet, while private subnet is not. To define access to the internet and between subnets we use **Route Tables**.

## Internet Gateway & NAT (Network Address Translation) Gateway

Both of these serve to access internet from within your subnets.

Internet gateway helps our VPC connect with the internet and public subnets have direct route to it. On the other hand private subnets do not have direct access to this gateway, and if you want to connect to internet from private subnet you need to use NAT gateway or NAT instances.

NAT gatway is AWS managed solution for connecting to internet from private VPC, while NAT instance is self-managed. To use NAT instance you first need to spawn it within some public subnet and connect to it from private. This instance will than serve as proxy between private subnet and internet.

## Network ACL (NACL) and Security Groups

NACL is similar to Security Group. It is a firewall that controls traffic from and to subnet (its on subnet level), it can deny and allow certain IP addresses (only works with IP addresses).

So before traffic reaches your EC2 instance (or security group around it) it first goes through NACL, default NACL allows everything in and out, that's why you don't need to configure it from the get go.

## VPC Peering

You can connect VPC networks across regions or accounts and make them behave as one using VPC Peering. When connecting VPCs CIDR (IP address range) must not overlap.

VPC Peering is not transitive, imagine following configuration:

VPCA <-> VPCB <-> VPCC

You cannot contact VPCC from VPCA even tho they are connected through VPCB

## VPC Endpoints

AWS Services are public, so when your EC2 instance is talking to some AWS service like S3 it is done publicly. But sometimes your EC2 instance are within private subnet in that case you can use VPC Endpoints Gateway or VPC Endpoint Interface.

VPC Endpoint Gateway: S3 and DynamoDB
VPC Endpoint Interface: others

## VPN and DX

When you want to connect your on-premises data center to Amazon VPC you have two options Site-to-Site VPN and Direct Connect (DX).

## 3 Tier solution architecture

- User contacts Route 53 it get your ELB IP address from your domain
- User is not talking to ELB directly, which is on public subnet (Layer 1)
- ELB is talking to ASG that host EC2 instances across AZs, since instances don't need to be exposed to outside world they live in private subnet (Layer 2)
- Those instances might need to store some data, in that case they can talk to other services like RDS or ElastiCache that should live on data subnet (Layer 3)

## Wordpress on AWS

- User contacts Route 53 it get your ELB IP address from your domain
- User is not talking to ELB directly, which is on public subnet
- ELB is talking to ASG that host EC2 instances across AZs, since instances don't need to be exposed to outside world they live in private subnet
- These instances need to share assets so we need EFS
- In order to connect to EFS from private network we need ENI (Endpoint Interface)
