# API Gateway

In order for users to use your Lambda function you need to expose it directly or use LoadBalancer. Another alternative is to use API Gateway as a proxy.

API Gateway helps you build REST API, and comes with many features such as:

- Support for WebSocket Protocol
- Ability to handle API Versioning (v1, v2...)
- Ability to handle different environments (dev, test, prod...)
- Ability to handle authentication and authorization
- Ability to handle request throttling
- Swagger / Open API import
- Ability to transform and validate requests and responses
- Generate SDK and API specifications
- Cache API responses

You can expose any AWS API through API Gateway but most common integration is with Lambda function. You can also expose any HTTP endpoint such as: HTTP API on premise, Application Load Balancer and so on. Benefits of doing this is to add rate limiting, authentication, API keys...

There are 3 **endpoint types** or ways of deploying API Gateway:

- Edge-Optimized (default) - API Gateway will live in one region, but it will accesible for all clients globaly since all requests are routed through CloudFront Edge locations.
- Regional - This is for clients within the same region. You can combine this with personal CloudFront distribution to have more control over caching strategies and distribution.
- Private - These endpoints can only be accessed from your VPC using ENI.

As for security you can have user authentication through:

- IAM Roles if its internal application
- Cognito or Custom Authorizer (some lambda function).

You can have HTTPS security through integration with AWS ACM (Certificate Manager). If you are using Edge-Optimized endpoint, certificate must be in **us-east-1**, but if you are using Regional endpoint than certificate must be in API Gateway region. You must also set up CNAME or A-alias record in Route53.

## Stages and Deployment

Making changes in API Gateway does not mean they're effective, you need to make a deployment for them to be in effect. When you are making deployment you will be asked to select or create Stage. You can have as many stages as you want, and you can name them as you please (dev, test, prod). Each stage will have its own configuration parameters, and they can be rolled back.

**Stage Variables** are like environment variables for API Gateway and they are passed to the `context` object in AWS Lambda. Format to access stage variable within API Gateway is `${stageVariables.variableName}`

We can use stage variables to indicate the corresponding Lambda alias, and our API gateway will automaticall invoke the right Lambda function.

## Integration Types & Mappings

There are several integration types:

- **MOCK** - API gateway returns a response without sending request to our backend, this is usefull when setting up API gateway.
- **HTTP / AWS** (Lambda and other AWS services) - We must configure both integration request and integration response. We can setup mapping templates to do data mapping for request and response.
- **AWS_PROXY** - Incoming request from client is input to Lambda. Here we can't change request and response in any way, and we can't do mapping templates, this is because API Gateway is just a proxy!
- **HTTP_PROXY** - Since this is proxy we don't have mapping templates, request is just passed (proxied) to the backend, and response from the backend is just forwared by API gateway. We have possibility to add HTTP headers if need be (example would be something like API Key)

### Mapping Templates

Mapping templates can only be used if we are working with HTTP and AWS integration types. They are used to modify request and response, and you can modify query params, body content, headers. Modifications are done using Velocity Template Language (VTL), scripting language that provides for loops, if statements etc..
You can also filter output results (remove unnecessary data).

To set mapping templates you must set `Content-Type` to be either `application/json` or `application/xml`.

## Open API

APi gateway has tight integration with OpenAPI, you can import existing OpenAPI 3.0 spec to API Gateway, or export current API as OpenAPI spec. OpenApi specs can be written in Yaml or JSON.

### Request validation

You can configure API gateway to perform basic validation of an API request before proceeding with integration request. If validation fails, API gateway immediately fails the request with 400 error.
You can check query string, headers and whether payload adheres to JSON Schema request model.

We do this by setting up OpenAPI definitions file

```json
{
  "openapi": "3.0.0",
  // define validators
  "x-amazon-apigateway-request-validators": {
    "all": {
      "validateRequestBody": true,
      "validateRequestParameters": true
    },
    "params-only": {
      "validateRequestBody": false,
      "validateRequestParameters": true
    }
  },
  "paths": {
    "/validation": {
      "post": {
        "x-amazon-apigateway-request-validators": "all"
      }
    }
  }
}
```

## Caching

API Gateway offers request caching abilities. Caches are defined on stage level, but you can override cache settings per method. Cache capacity is between 0.5GB to 237GB with option to encrypt it. Default TTL is 300 seconds while max is 3600 seconds.

You are able to flush the entire ache immediately, or you can have client invalidate the cache with header `Cache-Control: max-age=0`.
Make sure to impose InvalidateCache policy (or choose Requre authorization checkbox in console) otherwise any clent can invalidate cache.

## Usage plans and API Keys

If you want to make your API available as an offering to your customers, you can set up usage plans with API keys.

Usage plans define:

- Who can access your API stages and methods
- How much and how fast they can access them
- Which API keys are linked. To identify clients and meter their access.
- Throttling and quota limits. Quota limits are enforced on individual client.

API keys are alphanumeric string values we create and distribute to our customers. We can use them with usage plans to control access.

There is a correct order of actions to properly configure usage plan:

1. Deploy API with methods that require API key
2. Generate or import API keys
3. Create usage plan with desired throttle and quota limits
4. **Associate API stages and API keys with usage plan**

Callers must supply assigned API key in `x-api-key` header when they make API request.

## Monitoring, Logging and Tracing

### CloudWatch

When you enable CloudWatch log integration with API Gateway you're going to get information about request and response body. You can enable logs at stage level and define your log level (ERROR, DEBUG or INFO). Settings at stage level can be overridden on method level.

You can also monitor API Gateway with CloudWatch metrics. Metrics are shown on stage level, and you have possiblity to enabel detailed metrics. There are few metrics that are important:

- CacheHitCount and CacheMissCount - metrics for cache efficiency
- Count - total number of API request in a given period
- IntegrationLatency - time between when API Gateway relays request and when it receives response from your backend
- Latency - time between when API Gateway receives request from a client and when it returns a response.
- 4XXError - client-side errors
- 5XXError - server-side errors

### XRay

You can enable XRay to get tracing information about requests that go through the API Gateway.

### Throttling

API Gateway throttles at 10_000 requests per second across all APIs, this is a **soft limit on account level** that can be increased upon request. Since this is on account level if one API is overloaded this can cause the other APIs to be throttled!

In case of throttling clients are going to receive error 429 (too many requests) which is retriable error. To combat this you can set Stage and Method limits and define Usage Plans to throttle per customer.

### Errors

- 5xx Server errors:
  - 502 - _Bad Gateway Exception_, this usually happens when your Lambda proxy integration is not responding well.
  - 503 - _Service Unavailable Exception_, you backend is not available.
  - 504 - _Integration Failure_, example would be request timeout exception. API Gateway has request time out after 29 seconds.

## Authentication and Authorization

### IAM Permissions

We can attach IAM Policy to user/role and invoke our API Gateway. So in this case authentication is done through IAM and authorization is done through IAM policy. This is the optimal way of protecting your API Gatway if it's being accessed within your AWS account.

In order to pass IAM credentials to API Gatway we can leverage _Sig V4_ to sign and place credentials into headers.

### Resource Policies

Resource policy can be set on API Gateway to define who and what can access it.

Main use of resource policies is to have cross account access. We can combine resource policy with IAM to give access to some user/role in other accounts.
You can also use resource policy to filter for specific IP addresses, or to allow only for VPC Endpoint.

### Cognito

API Gateway can verify identity of people connecting to API with Cognito using the following flow:

1. Clients authenticate with Cognito User Pools to receive a token
2. Clients pass token with request to API Gateway
3. API Gatway has direct integration with Cognito and ca evaluate Cognito token before allowing access.

### Lambda Authorizer

This allows you to use 3rd party authentication system like OAuth to retrieve token, you can then pass this token to API Gateway however you like (Bearer token or request params). API Gateway will invoke Lambda Authorizer, a custom Lambda function we need to create. This Lambda function needs to talk with 3rd party system to confirm validity of that token. Once validity is confirmed Lambda must return IAM Policy (this policy will be cached in Policy Cache).

## Websockets API

You can deploy WebSocket API to API Gateway.

Client is going to connect to your WebSocket API and establish a persistent connection into it. This is going to invoke **onConnect** Lambda function and pass connectionId. We can persist connectionId and metadata in DynamoDB if we need.

After connection is established client can send some messages (frames) to the server. These frames will invoke new **sendMessage** Lambda function and pass connectionId, which we can use to retrieve user data from DynamoDB.

To send messages from API Gateway back to the client, Lambda function or backend needs to make **POST** request signed using _IAM Sig v4_ to **Connection URL callback** with connectionId specifed.
You can make other types of request to **Connection URL callback**. GET request will get you status connection and DELETE will disconnect the client.

### WebSocket Routing

In order for client to use WebSocket routing we need to define **Route Key Table** at the API gateway level. On this table we need to define `$connect`, `$disconnect` and `$default` routes which are mandatory, and then we can define our custom routes.

To read route from message we need to specify sample expression like `$request.body.action` to API Gateway. Expression result is going to be evaluated against Route Key Table available in API Gateway

Clients can then use WebSocket routing to invoke specific backend or Lambda function. If no routes are present in JSON message, it will be sent to `$default` route.
