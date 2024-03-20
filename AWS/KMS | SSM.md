# KMS (Key Managment Service)

Anytime you hear _encryption_ for AWS service, it's most likely KMS. KMS is AWS managed service and is fully integrated with IAM for authorization. Advantage of KMS is that you can audit KMS Key usage with CloudTrail.

## KMS Key Types

- Symmetric (AES-256) - There's only one key that is used to both encrypt and decrypt data, because of this you can never get access to it, and to use it you must call KMS API. AWS services that are integrated with KMS use symetric CMKs (Customer Managed Keys)
- Asymmetric (RSA & ECC key pairs) - There's public and private key pair, where public key is used for encryption and private key for decryption. Public key is downloadable, while private key can't be accessed. Use case for this type is when we need encryption outside of AWS where KMS API is not available.

Within KMS we have following types:

- AWS Owned Keys - These are free default keys (SSE-S3, SSE-SQS, SSE-DDB)
- AWS Managed Key - These are also free, they are usually named _aws/service-name_
- Customer Managed Keys - These can be either created in KMS or imported, and they cost 1$ per month with additional $0.03 per 1000 KMS API calls. If they are imported they need to be symmetric.

As for key rotation both AWS Managed and Customer Managed Keys have automatic rotation every 1 year. Imported KMS Keys must be manually rotated.

**Note:** KMS keys are scoped to specific region

## KMS Key Policies

They work similarly to S3 bucket policies, difference is that if you don't have KMS key policy on your KMS key, then no one can access it.

There are two types of KMS key policies:

1. Default policy - This one is created if you don't provide a specific custom key policy. Idea behind this policy is to allow everyone in your account to access this key.
2. Custom policy - This one allows you to define users and roles that can access KMS key, and you can define who can administer the key. This is especially helpful if you want to do cross-account access for your KMS key.

## Envelope Encryption

KMS Encrypt API call has limit of 4KB, so if we want to encrypt data >4KB we need to use Envelope Encryption. API that will help us is `GenerateDataKey`.

Idea behind envelope encryption is to do encryption on client side with key requested from KMS. Encrypted data is enveloped (wrapped) with encryption key. To decrypt data we send decryption request for encryption key to KMS, and in response we get decrypted key which we can use to decrypt our data.

Envelope encryption is implemented in AWS Encryption SDK.

## KMS Limits

There's a limit on how many times you can call KMS service per second, and if limit is exceeded you get ThrottlingException. One important thing to note is that **cryptographic opertation quota is shared**, this means that requests made by AWS on your belhalf (ex: SSE-KMS) are included. You can create ticket to increase this quota.

## S3 Bucket Key

This S3 feature allows you to decrease number of API calls made to KMS by 99%, and therfore decrease the cost by same amount. Idea is to generate and rotate S3 bucket key which is going to be used for data encryption. This key lives in S3 so there is no need to make additional KMS calls. This is very useful if you are using SSE-KMS at a large scale.

# CloudHSM (Hardware Security Module)

With KMS, AWS manages encryption software and has control over the encryption keys, but with CloudHSM, AWS will provision some encryption hardware called HSM device, and we are going to manage our own encryption keys.

HSM device lives within AWS cloud, but it's temper resistant. It supports both symmetric and asymmetric encryption, and to use it you need CloudHSM Client Software.

CloudHSM is integrated with AWS Service through KMS by configuring KMS Custom Key Store with CloudHSM.

# SSM Parameter Store

This is a secure storage for configurations and secrets, which you can optionaly encrypt with KMS. It has version tracking and is well integrated with CloudFormation. Access security is done through IAM.

You can organize your secrets, like this:

- /my-department-1
  - /my-app-1
    - /dev
      - db_url
      - db_password
    - /prod
      - db_url
      - db_password
  - /my-app-2
- /my-department-2

This can be leveraged in IAM policies to allow applications to have access to entire department, app or specific path.

There are **Parameter Policies** for advanced parameters which allow you to assign TTL to a parameter. This can be used to force updating or deleting sensitive data.
You can assign multiple policies to a parameter. There are three types of policies:

- Expiration - you specify time after which parameter will expire
- ExpirationNotification - you specify when to send expiration notification, for example 15 days before expiration
- NoChangeNotification - you specify time after which you should receive notification if parameter wasn't updated

# Secrets Manager

This is a newer service meant for storing secrets. It has capability to force rotation of secrets every X days. Secrets are encrypted using KMS and you can automate generation of secrets on rotation using Lambda. It has integartion with Amazon RDS.

You can also replicate secrets across multiple AWS Regions, and Secrets Manager will keep replicas in sync. This is good if you have multi-region applications or DBs, and on top of that you have the ability to promote read replica secret to standalone secret in case of a disaster.

# CloudFormation - Secrets Manager & SSM Parameter Store

Values stored within Secrets Manager and SSM Parameter Store can be accessed within CloudFormation template. Syntax for accessing values is `{{resolve:service-name:reference-key}}`.

Template supports 3 types of `service-name`:

1. ssm - when you want to access regular value `{{resolve:ssm:parameter-name:version}}`
2. ssm-secure - when you want to access encrypted value `{{resolve:ssm-secure:parameter-name:version}}`
3. secretsmanager - when you are accessing secretsmanager value `{{resolve:secretsmanager:secret-id:secret-string:json-key:version-stage:version-id}}`

# CloudWatch Logs Encryption

You can encrypt CloudWatch logs on group level using KMS, but you can only do it through CLI using `aws logs associate-kms-key --kms-key-id arn:aws:kms:<region>:<key>` or `aws logs create-log-group --kms-key-id arn:aws:kms:<region>:<key>` to create new log group and associate KMS encryption key in one go.

# AWS Nitro Enclaves

Historically if you wanted to process some sensitive data like PII (Personally Identifiable Information), credit cards and others you would have to create dedicated VPC and restrict access to it.

Nitro Enclaves provide shortcut to this process by offering fully isolated virtual machines that are hardened and highly contrained, no external networking, no interactive access (SSH) and no persistant storage. Thanks to **Cryptographic Attestation** only authorized code can run in your Enclave.
