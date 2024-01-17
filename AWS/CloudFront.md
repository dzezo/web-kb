# Cloud Front

Whenever you see CDN (Content Delivery Network) think of CloudFront. It's main purpose is to bring content closer to the user by caching it on the edge.
There are 216 Points of Presence (edge locations) globally and Amazon is growing this number. These points also come with DDoS protection, integration with Shield and AWS Web Application Firewall.
_How this works?_ Lets say that you have S3 bucket website in Australia, when user tries to access it in US he is going to hit local Point of Presence instead of S3 in Australia. That edge point is going to communicate with your remote S3 bucket to retrieve and cache your website. Now every subsequent request is going to be much faster due to cache hit.

## Origins

- S3 bucket - For distributing files and caching them at the edge. You can make sure that your S3 bucket is only accessible through CloudFront with Origin Access Control (OAC). CloudFront can also be used as an ingress (to upload files to S3)
- Custom Origin - ALB, EC2 instance, S3 website or any HTTP backend you want.

## CloudFront vs S3 Cross Region Replication

They are two different things CloudFront is CDN tasked to **make your static content available everywhere**. S3 Cross Region Replication is actually replicating your bucket in different region and it is great for **dynamic content that needs to be available in few regions**.

## Caching and Caching Policies

Cache lives at each CloudFront edge location, and it identifies each object using Cache Key. Your goal is to maximize Cache Hit ratio to minimize requests to the origin.
You don't have to wait for cache to expire you can invalidate part of the cache using CreateInvalidation API.

### Cache Key

Cache key is unique identifier for each object in the cache. By default cache key is made up of hostname + resource portion of the URL:

| Key                                        | Object |
| :----------------------------------------- | :----- |
| mywebsite.com/content/stories/example.html | object |

If you have an application that serves up content that varies based on user, device, language, location... You can add other elements like HTTP headers, cookies and query strings to your Cache Key by using **CloudFront Cache Policies**.

### Cache Policies

You can cache based on:

- HTTP Headers
  - None
  - Whitelist
- Cookies
  - None
  - Whitelist
  - Include all except
  - All
- Query strings:
  - None
  - Whitelist
  - Include all except

You can control TTL (0 seconds to 1 year) or you can set by the origin using `Cache-Control` and `Expires` header. All HTTP headers, cookies and query strings that you include in the cache key are automatically included in request that is forwarded to origin.

If you want to get something sent to origin but you don't want it included in Cache Key you need **Origin Request Policy**. You can include HTTP headers, cookies and query strings in the same way you would in Cache Policy.
You can add CloudFront HTTP headers and custom headers to origin request that were not included by initial user's request.

## Cache Invalidation

CloudFront doesn't know about your backend origin and will only get updated content after TTL has expired. However you can force an entire or partial cache invalidation by performing CloudFront invalidation.

## Cache Behaviors

You can route to different kind of origins or origin groups based on the content type or path pattern:

- /images/\* - can route to S3 bucket
- /api/\* - can route to ALB
- /\* - default cache behavior

When adding Cache Behaviors, the default behavior is always going to be processed last.

## ALB as Origin

There is no private VPC connectivity in CloudFront so your EC2 Instances must be accessible publicly. One way of acomplishing this is by having a security group that allows IP addresses of all edge locations. Second approach is to have ALB that is public infront of your private EC2 instances.

## Geo Restriction

You can restrict who can access your distribution with Allowlist or Blocklist.

- Allowlist - Allow your users to access your content only if their country is on list of approved countries
- Blocklist - Prevent your users from accessing your content if their country is on a list of banned countries

Country is determined by using 3rd party Geo-IP database. Common use case is copyright laws to control access to content.

## Signed URL / Cookies

You can use signed URLs or Cookies when you want to distribute paid content to premium users over the world. To create this URLs and cookies you need to attach a policy with:

- Expiration date for URL or cookie
- What IP addresses can access this data
- Trusted signers (which AWS accounts can create signed URLs for your users)

Difference between signed URL and a cookie is that **signed URL gives access to individual file** while **cookie gives access to multiple files and can be reused**.

There are two types of signers:

- Trusted key group (recommended) - You can leverage APIs to create and rotate keys (and IAM for API security)
- AWS account that contains CloudFront Key Pair (not recommended) - You need to use root account and AWS console to manage its keys

How key pair is used? Private key is used by your applications (e.g. EC2) to sign URLs and public key is used by CloudFront to verify this signature.

### CloudFront SignedURL vs S3 Pre-Signed URL

CloudFront SignedURL works for origins other than S3 like your backend for example and you can leverage CloudFront caching features. Also if your S3 bucket is configured to be used through CloudFront (OAC) you need to use SignedURL.

## Advanced concepts

### Pricing

Pricing for CF varies between edge location and it depends on data throughput. You can reduce number of edge locations to reduce cost, you have three price classes to chose from:

1. All - All regions
2. 200 - Most regions, but excludes the most expensive ones
3. 100 - Only the least expensive regions

### Origin Groups

You can use Origin Groups to increase availability and do failover. Using this you can specify primary and secondary origin which is going to be hit only when primary fails.
Example: You have 2 instances A and B, if origin A respons with error CloudFront will try same request on origin B and hopefuly it responds with status OK.
Example: You have 2 buckets with replication if CloudFront fails to retrieve something from first bucket in case of AWS failure its going to try the same in 2nd bucket.

### Field Level Encryption

You can use this to protect user sensitive information (credit card) through application stack. Sensitive informations are encrypted at the edge location (up to 10 fields) using public key and only decrypted and understood by final destination (web server).

## Real time logs

You can send received requests to Kinesis Data Streams in real time. Goal of this is to monitor, analyze and take actions based on content delivery perfomance. You can specify sampling rate (percentage of requests you want to recieve) and specific behaviors (path patterns).
