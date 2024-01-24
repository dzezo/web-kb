# Beanstalk

## Overview

Beanstalk is a free managed service, you pay just for underlying AWS resources.

### Components

- Application - collection of Beanstalk components (environments, versions, configurations...)
- Application Version - iteration of your application code
- Environment - collection of AWS resources running an application version (only one application version at a time). You can create multiple environments (dev, test, prod...). There are two tiers **Web Server Environment** & **Worker Environment**

### Deployment Modes

There are two types of deployment modes **single instance** (great for dev) and **high availability with load balancer** (great for prod).

## Deployment Updates

### All at once

It replaces instances with old version like this:

1. v1, v1, v1, v1
2. , , ,
3. v2, v2, v2, v2

Deployment is very fast with no additional cost, but it has downtime. This is great for development environment when you don't really care about downtime.

### Rolling

You set **bucket size** and it replaces old instances like this:

0. bucketSize = 2
1. v1, v1, v1, v1
2. v1, v1, xx, xx
3. v1, v1, v2, v2
4. xx, xx, v2, v2
5. v2, v2, v2, v2

Deployment is very slow with no additional cost. Application will have no downtime but will operate at reduced capacity, also at some point both version will run simultaneously.

### Rolling with additional batches

This rolling update keeps aplication at full capacity by provisioning extra instances which ofcourse will have some additional cost.

Example of how it works:

1. v1, v1, v1, v1
2. v1, v1, v1, v1, v2, v2 (new additional batch)
3. xx, xx, v1, v1, v2, v2
4. v2, v2, v1, v1, v2, v2
5. v2, v2, xx, xx, v2, v2
6. v2, v2, v2, v2, v2, v2
7. v2, v2, v2, v2 (additonal instances are terminated)

### Immutable

This is deployment type with zero downtime. It accomplishes this by **deploying another temporary ASG** with new instances, which ofcourse doubles the cost. This temporary ASG allows for quick rollback in case of failures, by just terminating new ASG.

When new ASG is provisioned only one instance gets deployed, this instance serves to check for failures, if everything is alright others get deployed.
After deployment is done, migration of all instances to original ASG comences. Once migration is over old instances are terminated.

### Blue/Green

This is not a direct feature of Elastic Beanstalk.

It works by deploying new "stage" environment for v2. Then we setup Route 53 using weighted policies to redirect a little bit of traffic to "stage" environment. After everything is confirmed to be ok we use **swap URL** from Beanstalk.

### Traffic Splitting

This is used for **Canary Testing**. New application version is deployed to temporary ASG with the same capacity. Small percentage of traffic is sent to the temporary ASG for configurable amount of time. Deployment health is monitored and if there is failure automated rollback is triggered.
Once everything is stable and correct, instances are going to be migrated from temporary to main ASG.

## Beanstalk CLI

We can install additional CLI called **EB CLI** which makes working with Beanstalk from CLI easier. Basic commands are: eb create, eb status, eb health...
This is really helpful for automated deployment pipelines.

## Beanstalk Lifecycle Policy

Beanstalk can store at most 1000 application versions, and if you don' remove old versions, you won't be able to deploy anymore.
To phase out old versions you can use lifecycle policy. **Lifecycle policy can be based on time or space**. Versions that are currently in use will not be deleted, even if they are old and take too much space. There's also option to not delete source bundle in S3 to prevent data loss.

## Beanstalk Extension

All parameters set in UI can be configured with code using files called **EB extensions**. We can include them in source code zip file that must be deployed to Beanstalk.

These files need to be in the `.ebextensions/` directory in source code root. They need to be in **JSON or YAML format** but their extension must be **.config** (example: logging.config). Using these files you are able to modify some default settings using `option_settings` and add resources such as RDS, ElastiCache, DynamoDB... Resources managed by .ebextensions get deleted if the environment goes away.

## Beanstalk and Cloudformation

Beanstalk uses Cloudformation under the hood to provision AWS services. Which means that even tho Beanstalk UI is limited in terms to what you can provision, you can always instruct underlying Cloudformation to provision some service using .ebextensions.

## Cloning

This feature allows you to clone an environment with the exact same configuration. All resources and configuration are preserved (load balancer type and config, RDS db type, env variables), after cloning you can change settings.

## Migration

### Load balancer

After creating Beanstalk environment **you cannot change load balancer type** only its configuration. So in order to migrate from one type to another you need to:

1. create new environment with same configration except LB, **you can't use clone**
2. deploy your application onto new environment
3. perform CNAME swap or Route 53 update

### RDS

RDS can be provisioned with Beanstalk, which is greate for dev/test. This is not great for prod because db lifecyccle is tied to Beanstalk environment lifecycle.
The best approach is to create RDS separetely and use connection string to connect, you can use Beanstalk environment variables to expose connection string to your application.

But in case you already have RDS in your Beanstalk environement you need to:

1. Create RDS snapshot just in case
2. Go to RDS console and protect RDS db from deletion
3. Create new Beanstalk environment without RDS and point your application to existing RDS using environment variables
4. Perform CNAME swap or Route 53 update
5. Terminate old environment
6. Cloudformation will be in DELETE_FAILED state, so we need to go there and delete our stack manually.
