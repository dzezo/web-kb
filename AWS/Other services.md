# SES (Simple Email Service)

Service for sending emails using SMTP interace or AWS SKD. You can also receive emails, and it has integration with S3, SNS and Lambda.

# OpenSearch

Amazon OpenSearch is successor to Amazon ElasticSearch.

In DynamoDB queries only exist by primary key or indexes, with OpenSearch you can search any field, even for partial matches. It's very common to use OpenSearch services to provide search to your application.

You have two modes managed cluser or serverless cluster.

OpenSearch has its own query language and it does not natively support SQL, but this can be enabled via plugin.

## Common pattern

Say that you use DynamoDB to store user data. When users inserts, updates or deletes data all the streams are sent to DynamoDB Stream, which is picked up by Lambda Function. Lambda then inserts data into Amazon OpenSearch in real time. This gives your application ability to do a partial search on any field and get DynamoDB item ID, which you can use to get actual items from your store.

# Athena

This is serverless query service that is used to analyze data stored in Amazon S3. Pricing is simple, you pax fixed amount of money per TB of data scanned.

To improve Athena performance you can:

- Use columnar data - Since you are billed per data scanned, you can choose to scan only columns of interest.
- Compress data
- Partition datasets in S3 - organize data in directories to narrow your search
- Use larger files - files larger then 128 MB are easier to scan and retrieve then multiple smaller ones.

Athena can be used to run SQL queries across data stored in relational, non-relational and custom data sources. These queries are called **Federated Queries**. To do federated query you need **Data Source Connector**. Result of this query can be stored in S3 bucket.

# Amazon MSK (Managed Streaming for Apache Kafka)

Kafka is used for data streaming and it is alternative to Amazon Kinesis. Amazon MSK gives you ability to get fully managed Kafka cluster on AWS.

- You can create, update and delete clusters
- MSK creates and manages Kafka brokers and Zookeeper nodes for you
- You can deploy in your VPC, multi AZ
- Automatic recovery from common Kafka failures
- Data is stored on EBS volumes for as long as you want

You have MSK serverless option, where you don't need to provision capacity in advance.

# ACM (Amazon Certificate Manager)

ACM lets you easily provision, manage and deploy SSL/TLS Certificates. These certificates are used to provide in-flight encryption for website (HTTPS). It supports both public and private TLS, but only public TLS certificates are free of charge. It has automatic TLS certificate renewal and it has integrations (loads TLS certificates on) with ELB, CloudFront Distributions and APIs on API Gateway.

# Amazon Macie

Fully managed data security and privacy service that uses machine learning and pattern matching to discover and protect your sensitive data in AWS. It identifes and alerts you to sensitive data such as personally identifiable infromation (PII).

# CloudWatch Evidently

This is a feature of CloudWatch that is used to safely validate new features by serving them to a specified % of users.
There are two use cases that are enabled by CloudWatch Evidently:

1. Launches (feature flags) - allows you to enable or disable features for a subset of users
2. Experiments (A/B testing) - allows you to compare multiple versions of feature.
3. Overrides - pre-define variation for specific user (your beta tester)

Experiment data can be stored in S3 or CloudWatch Logs.
