# EC2 Instance Metadata IMDS

AWS EC2 Instance Metadata Service (IMDS) allows EC2 instances to learn about themselves without using an IAM Role for that purpose.
There are two versions of this service IMDSv1 and IMDSv2. IMDSv1 is accessing `http://169.254.169.254/latest/meta-data` directly, while IMDSv2 is more secure and it is done in two steps:

1. Get Session Token (limited validity)

```zsh
TOKEN=`curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600"`
```

2. Use session token in IMDSv2 calls

```zsh
curl `http://169.254.169.254/latest/meta-data/profile` -H "X-aws-ec2-metadata-token: $TOKEN"
```

# CLI Profiles

If you ever have a need to work and manage multple account, you can setup additional accounts using `profile`

```zsh
aws configure --profile my-other-aws-account
```

This will ask you for some additional information, once you enter them account will be ready to use. You can verify this in `credentials` file, there you should be able to see `my-other-aws-account` profile data alongside `default` profile data.

To execute aws commands with some account that is not your default you need to specify that profile

```zsh
aws s3 ls --profile my-other-aws-account
```

# CLI with MFA

To use MFA with CLI you must create a temporary session. To do so you must run `sts get-session-token` API call

```zsh
aws sts get-session-token --serial-number arn-of-the-mfa-device --token-code authenticator-code --duration-seconds 3600
# Create mfa profile and insert access key and secret access key
aws configure --profile mfa
# You need to add aws_session_token to credentials file manually
```

# SDK

You use SDK (Software Development Kit) when you want to perform actions on AWS directly from your application. One thing to note about AWS SDK is that if you don't specify region, then `us-east-1` will be chosen by default.

# AWS Limits

API Rate Limits examples:

- DescribeInstances API for EC2 has a limit of 100 calls per second
- GetObject on S3 has a limit of 5500 GET per second per prefix

Depending on how often you hit these limits you can do one of these two things:

- For Intermittent Errors - Implement Exponential Backoff
- For Consistent Errors - Request an API throttling limit increase directly from Amazon

Service Quotas (Service Limits) examples:

- Running On-Demand Standard Instances: 1152 vCPU

If you need more you can request a service limit increase by opening a ticket or by using Service Quotas API.

## Exponential Backoff

You should implement exponential backoff if you are getting **ThrottlingException** errors.
Exponential backoff is retry mechanism with increasing delay after each retry. This mechanism is already included in AWS SDK API calls, but if you are using AWS API as-is than you must implement it your self. If you are implementing this your self you must only implement retries on 5xx server errors.

# CLI Credentials Provider Chain

The CLI will look for credentials in this order

1. Command line options: --region, --profile and --output
2. Environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS_SESSION_TOKEN
3. CLI credentials file (aws configure)
4. CLI configuration file (aws configure)
5. Container credentials (for ECS tasks)
6. Instance profile credentials (for EC2 Instance profiles)

**Bad practice example**

You deployed application on EC2 instance using environment variables from an IAM user to call Amazon S3 API. This IAM user has S3FullAccess permissions.
Application should only use one S3 bucket, so according to best practices you created IAM Role and EC2 Instance Profile for this EC2 instance. The Role was assigned minimum permissions to access only that one bucket.
**Credentials chain will give priorities to environment variables, so instance profile credentials will be superseeded**.

# Signature v4 Signing (Sigv4)

When you call AWS HTTP API you sign the request so that AWS can identify you, using your AWS credentials (access key and secret access key). If you are using SDK or CLI HTTP requests are signed for you.

If you want to do it on your own you need to create signature yourself and send it via Header or Query.
