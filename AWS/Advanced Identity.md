# STS (Security Token Service)

This service allows you grant limited and temporary, up to 1 hour, access to AWS resources.

STS API:

- AssumeRole - assume roles within your account or cross acount
- AssumeRoleWithSAML - return credentials for users logged with SAML
- AssumeRoleWithWebIdentity - return credentials for users logged with Identity Provider (Facebook login, Google login...), it is recommended to use Cognito Identity Pools instead
- GetSessionToken - for MFA
- GetFederationToken - obtain temporary credentials for a federated user
- GetCallerIdentity - return details about IAM user or role used in API call
- DecodeAuthorizationMessage - decode error message when AWS API is denied.

## Assuming role with STS

First you define IAM Role within your account or cross-account. This role needs to define which Principals can access it, and we authorize everything with IAM policies. Then we use AWS STS AssumeRole API to retrieve credentials and impersonate IAM role. Temporary credentials can be valid for 15 to 60 minutes.

# Advanced IAM

## Policy evaluation

When evaluating policies `DENY` is evaluated before `ALLOW`. If there's not explicit `DENY` or `ALLOW`, finaly decision will be `DENY`.

Bucket policies are evaluated in union with IAM policies.

## Dynamic Policies

Say that you have to give each user access to specific directory in S3 bucket. One option is to create IAM policy for each user, which ofcourse doesn't scale well. Other option is to create dynamic policy where you can leverage special policy variable `${aws:username}`

## Inline vs Managed Policies

There are three types of policies in AWS:

1. AWS Managed policy - This type of policy is maintained by AWS, so it's automatically updated in case of new services or APIs.
2. Customer Managed policy - Created and managed by user, you can apply one policy to as many principals as you want, so its reusable. They are also version controlled and you have ability to rollback.
3. Inline policy - This policies are directly within principle, so there is strict one-to-one relationship between policy and principle, so when IAM principle is deleted so is policy.

## Passing a Role to AWS Service

To configure IAM service you need to **pass** IAM Role to it. Service will then assume this role and perform actions. In order to pass role to a service you need IAM permission `iam:PassRole`, this often comes with permission `iam:GetRole` to view the role thats being passed.

Not every Role can be passed to any service, Roles can only be passed to the service based on what their **trust** allows. Trust policy allows service to assume the role.

# AWS Directory Services

Microsoft Active Directory (Microsoft AD) is a software found on any Windows server with AD Domain Services. It's database of objects which can be: user accounts, computers, printers, file shares and security groups.

AWS Directory Services provide you a way to create an active directory on AWS. We have 3 options for creation:

1. AWS Managed Microsoft AD - Allows you to create AD on AWS, and it can work in tandem with on-premise AD, so you can have users/objects in both ADs (if user/object is not found in one AD it will look into the other). Also, this type supports MFA.
2. AD Connector - It serves as proxy to on-premise AD, and it also supports MFA.
3. Simple AD - AD only exist on AWS, and it can't be joined with on-premise AD.
