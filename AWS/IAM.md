# IAM - Identity and Access Management (Global service)

## Users & Groups

Root account is created by default and should be used only for AWS configuration, for anything else we need to create **User** within IAM.
Users are people within your organization. These users can then be grouped, and some users can belong to multiple groups.

## Permissions

We create users and groups to give them permissions to use our AWS account. We give permissions by assigning **policies**.
Policy is JSON document that describes what user/group can do, and we should follow **least privilege principle** when giving permissions. This means don't give more permissions than a user needs!

When you attach policy to a group, each group member (user) will inherit this policy, so if a user is a member of two groups he will inherit both policies.
User can exist outside of group as a standalone user, in that case we can give that user **inline** policy.

## Policy structure

Required properties are highlighted.

- Id - policy id
- Version - policy language version
- **Statement** - list of statements
  - Sid - statement id
  - **Principal** - account/user/role to which this policy applies
  - **Effect** - whether statement allows or denies action ("Allow" | "Deny")
  - **Action** - list of actions this policy allows or denies
  - **Resource** - list of resources to which policy actions apply
  - Condition - conditions for when this policy is in effect

## Password policy

To protect your users from brute-force attacks you can attach password policy. In password policy you can specify:

- minimum password length
- specific character requirements like including numbers, upper and lower case letters
- expiration time
- rule to allow users to change their own password
- rule to prevent password re-use

## MFA

It is highly recommended to protect Root and IAM users using MFA.

MFA devices options in AWS are:

- Virtual MFA device (supports multiple tokens on a single device)
  - Google Authenticator (phone only)
  - Authy (multi-device)
- U2F (Universal 2nd Factor) Security Key
  - YubiKey
- Hardware Key Fob (privezak) MFA Device
- Hardware Key Fob (privezak) MFA Device for AWS GovCloud (US)

## Accessing AWS

- AWS Management Console (protected by password + MFA)
- AWS Command Line Interface (CLI) (protected by access keys)
- AWS Software Development Kit (SKD) (access through code, protected by access keys)

Access keys (key ID and secret key) are generated through AWS console under **security credentials** tab. These keys can be generated and managed by users and are secrets just like passwords so don't share them.

- **Access Key ID** is like username
- **Secret Access Key** is like password

After installing AWS CLI you can configure it with your credentials by running `aws configure`. If you don't fancy installing AWS CLI there is AWS CloudShell (online terminal, not available for all regions).

## IAM Roles

There can be situations in which some AWS service needs to perform action on your behalf. To enable this **service** to do something it **needs permissions**.

To give permissions to service we need to create **IAM Role** and attach policies to it. You can think of it as **User, but not for humans**.

## IAM Security Tools

- **Credentials Report** (account-level)
  - list of all your users and status of their credentials
- **Access Advisor** (user-level)
  - shows service permissions granted to a user and when those services were last accessed, you can use this to revise policies and reduce permissions if they are not being used.

## Best Practices

- Don't use root account, except for AWS account setup
- One physical user = One AWS user
- Assign users to groups and assign permissions to groups
- Create strong password policy
- Enforce use of MFA
- Create and use Roles for giving permissions to AWS services
- Use Access Keys for programmatic access (CLI/SDK)
- Audit permissions (Credentials report and Access Advisor)
- Never share IAM users and Access Keys

## Shared Responsibility Model for IAM

Your responsibilities

- Management and monitoring of Users, Groups, Roles and Policies
- Enforcing MFA on all accounts
- Rotating all your keys often
- Using IAM tools to apply permissions
- Reviewing and analyzing permissions

AWS responsibility

- Infrastructure
- Configuration and vulnerability analysis of services they provide
- Compliance validation
