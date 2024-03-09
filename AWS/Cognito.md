# Cognito

## Cognito User Pools (CUP)

This is a feature that helps you create serverless database of users for your web and mobile apps. CUP integrates with API Gateway and Application load balancer.

It supports:

- Simple login: Username/Email and password combination
- Password reset
- Email and Phone number verification
- Multi-factor authentication (MFA)
- Can integrate with Facebook, Google auth (Federated Identities)
- Feature that scans credentials and blocks users if their credentials are compromised elsewhere
- Sends JWT upon authentication

### Lambda triggers

CUP can invoke Lambda function synchronously when some Cognito event/trigger happens.
There are 4 trigger types:

- Sign-up
  - Pre Sign-up - Custom validation to accept or deny sign-up request
  - Post Confirmation - Custom welcome messages or event logging for custom analytics
  - Migrate User - Migrate user from an existing user directory to user pools
- Authentication
  - Pre Authentication - Custom validation to accept or deny sign-in request
  - Post Authentication - Event logging for custom analytics
  - Pre Token Generation - Augment or suppress token claims
- Custom Authentication
- Messaging
  - Custom Message - Advanced customization and localization of messages

### Hosted UI

Cognito offers a hosted authentication UI that you can customize and add to your application. Also, this hosted UI has great integration with social logins.

If you decide to host this UI on your own domain, you must create certificate for using HTTPS and that certificate must be in ACM on us-east-1.

### Adaptive Authentication

Cognito can block sign-ins or require MFA if login appears to be suspicious. Cognito examins each sign-in and generates risk score (low, medium, high) for how likely the sign-in request is to be from a malicious attacker. If risk is detected users are prompted for a second MFA only authentication. Risk score is based on different factors such as if user has used the same device, location or IP address. There is also integration with CloudWatch Logs in which you can track all these sign-in attempts, risk scores and failed challenges

### JWT

JWT consists of 3 parts: header, payload and signature (`<header>.<payload>.<signature>`). In order for payload to be trusted signature needs to be verified.

## Application Load Balancer - User Authentication

You can use CUP to authenticate with API Gateway and that's pretty straight forward. There is also option to use your ALB for authentication. Idea is to shift load from your applications so that they can focus only on their business logic.

Authentication can be done through:

- Identity Provider (IdP): OpenID Connect (OIDC) compliant
- Cognito User Pools
  - Social IdPs such as Amazon, Facebook or Google
  - Corporate identities using SAML, LDAP or Microsoft AD

When setting up listeners you must use HTTPS to set `authenticate-oidc` or `authenticate-cognito` rules.

## Cognito Identity Pools

You can use Cognito Identity Pools to give access to AWS Resource, like S3 or DynamoDB table, to many users you don't trust.

Cognito Identity Pools allow your users to login through:

- Trusted third party public provider, like Amazon, Facebook, Google and Apple
- Cognito User Pools
- OpenID Connect Providers & SAML Identity Provides
- Custom login server (Developer Authenticated Identities)
- Unauthenticated (guest) policy

Once logged in users will receive AWS credentials and they can access AWS services directly or through API Gateway. IAM policies applied to credentials are defined in Cognito and the can be customized based on user_id using **policy variables** for fine grained control.
