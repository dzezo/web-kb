# S3 Security

## S3 Encryption

You can encrypt your objects in S3 using one of 4 methods:

- Server-Side Encryption (SSE)
  - SSE with Amazon S3 Managed Keys (SSE-S3) - enabled by default, encryption keys are managed and owned by AWS
  - SSE with KMS (SSE-KMS) - leverages AWS Key Management Service (KMS) to manage encryption keys
  - SSE with Customer-Provided Keys (SSE-C) - when you want to manage your own keys
- Client-Side Encryption

### SSE-S3

Encryption keys are handled, managed and owned by AWS. Objects are encrypted on server (on Amazon). Encryption type is AES-256 and if you want to instruct S3 to encrypt your objects you need to set header `x-amz-server-side-encryption` to `AES256`. This encryption is enabled by default.

### SSE-KMS

This method allows you to manage your own keys using AWS KMS. Objects are encrypted on server and to instruct S3 to encrypt using KMS keys you need to set header `x-amz-server-side-encryption` to `aws:kms`.

There are some limitations when using this method. Whenever you upload and download objects from S3 bucket you are internally calling KSM API to encrypt and decrypt data, and KMS has rate limiter based on region that ranges from 5500 to 30000 requests per second. You can request quota increase using Service Quota Console if your application requires higher throughput.

### SSE-C

Keys are managed by user outside of AWS, but objects are still encrypted on Amazon. Amazon S3 will not store your keys and will discard them after usage. You must provide encryption keys in headers of every request and therefore you **must use HTTPS**.

### Client-Side Encryption

This method is alternatiev apporach to server side encryption where client is responsible for both encrypting and decrypting. There are libraries to make this easier like **Amazon S3 Client-Side Encryption Library**.

### Encryption in transit (SSL/TLS)

Encryption in flight is called SSL/TLS. Amazon S3 exposes two endpoints:

1. HTTP endpoint - non encrypted
2. HTTPS endpoint - encryption in flight

If you want to force encryption in transit you can attach policy in which you deny all requests that have `aws:SecureTransport` set to `false`, example:

```json
{
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-bucket/*",
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}
```

## S3 Cors

When browser is connecting to some cross-origin server it first sends preflight request to get options. Preflight request includes orgin from where request is comming from, and if cross-origin server is configured for cross-origin resource sharing (CORS) it will respond with CORS headers `Access-Control-Allow-Origin` and `Access-Control-Allow-Methods`.

You can think of S3 bucket as a cross-origin server and in order to use it we need to configure its CORS headers.

## MFA Delete

You can force users to generate a code on a device (usually mobile phone or dedicated MFA hardware) before doing important operations on S3. MFA Delete can be enabled/disabled only by bucket owner (root account) and to use it you need to enable Versioning first.

Once MFA Delete is enabled S3 will require code to:

- Permanently delete and object version
- Suspend bucket Versioning

You can enable MFA Delete only through console (for now):

```bash
aws s3api put-bucket-versioning --bucket {your-bucket-name} --versioning-configuration Status=Enabled, MFADelete=Enabled --mfa {arn-of-mfa-device mfa_code} --profile {root-mfa-profile-name}
```

## Access Logs

For audit purpose you may want to log all access to S3 buckets. Any request made to S3 from any account, authorized or denied, will be logged into another S3 bucket. Logging bucket must be in same AWS Region.

**Warning**: Do not set your loggin bucket to be the monitored bucket because it will create logging loop and your bucket will grow infinitely.

## Pre-signed URLs

S3 allows you to generate pre-signed URL using the S3 Console, AWS CLI or SDK. Users with pre-signed URL inherit the permissions of the user that generated URL for GET or PUT. With this URL they can access some protected file or upload a file to a private bucket for brief period of time.

Examples:

- Allow only logged-in users to download premium video from your S3 bucket.
- Allow temporarily a user to upload a file to a precise location in your S3 bucket.

## Access Points

When you have large S3 bucket that should be accessed by many different teams in your organization then you can use Access Points to better manage S3 bucket security.
Access Points allow you to keep bucket policy lean while moving access policies to Access Points. For example you can create Finance Access Point that has policy to only grant R/W to /finance prefix, you can than instruct your finance department to use this Access Point to access your S3 bucket.
Each Access point has its own DNS name (Internet Origin or VPC Origin) and access point policy.

### Access Points - VPC origin

When you want to define access point to only be accessible from within VPC you must create VPC endpoint to access the Access Point. VPC Endpoint must allow access to both target bucket and Access Point.

## Object Lambda

Whenever you want to process some data before you return it to a user you can leverage S3 Object Lambda Access Point. When users access this Object Lambda Access Point, lambda function is going to retrieve data from S3 and do some transformations before returning.

Use cases:

- Redacting personally identifiable information for analytics or non-production environments.
- Converting data formats (XML to JSON for example)
- Resizing and watermarking images on the fly using caller-specific details
