# Lambda

EC2 instances are virtual servers that are continuosly running regardless if something is happening, and if you want to scale you need to do something.

Lambdas are virtual functions that run on demand, run time is limited to 15 minutes, and scaling is automatic. You pay per lambda function invocation and compute time. Free tier has milion invocation and 400,000 GB/s of compute time. You can easily get more resources per function, up to 10GB of RAM, and with increase of RAM you will also get increase in CPU and network.

## Synchronous Invocations

Synchronous means direct invocation through CLI, SDK, API Gateway or ALB. Result is returned right away, and any error that happens must be handled on client side (retries, exponential backoff...)

Synchronous invocations can be user invoked or services invoked.

User invoked:

- Elastic Load Balancer (Application Load Balancer)
- API Gateway
- CloudFrond (Lambda@Edge)
- S3 Batch

Service invoked:

- Cognito
- Step Functions

### Integration with ALB

To expose Lambda function as an HTTP(S) endpoint you can use Application Load Balancer. When client hits ALB it will synchronously invoke Lambda function in a target group.

ALB communicates with Lambda function by converting HTTP to JSON and vice versa. There is a setting on ALB that allows for Multi-Header value conversion. When this is enabled HTTP headers and query string parameters that are sent with multiple values are shown as arrays within AWS Lambda event and response object.

```json
// With Multi-Header values enabled http://example.com/path?name=foo&name=bar will be shown as:
{
  "queryStringParameters": {
    "name": ["foo", "bar"]
  }
}
```

## Asynchronous Invocations

Asynchronous invocations are for service that will invoke function behind the scenes like Amazon S3, SNS Topic, CloudWatch Events, and so on.

Say we have S3 bucket and a new file event. This event will go into Lambda Service event queue from which Lambda function reads. Lambda function will try to process these events and if something goes wrong there is a retry mechanism in place. There are 3 tries in total: intial try, second try after one minute and the last one two minutes after that. You can define DLQ (dead letter queue) for failed processing. Since there is a retry mechanism it is important to makes sure processing is idempotent.

If you don't need to wait for function results asynchronous invocation can help you speed up your processing.

Asynchronous invocation services

- S3
- SNS
- CloudWatch Events / Event Bridge
- CodeCommit
- CodePipeline
- Simple Email Service
- CloudFormation
- IoT and IoT Events

## Event Source Mapping

There are three types of processing synchronous, asynchronous and event source mapping. So this is the last category of how Lambda can process events in AWS.

It applies to:

- Kinesis Data Streams
- SQS & SQS FIFO queue
- DynamoDB streams

Common thing here is that records need to be polled from the source. So that means that Lambda needs to poll from these services.

Say that we configured Lambda to read from Kinesis. Internally Event Source Mapping will be created which will be responsible for polling Kinesis. Once this Event Source Mapping has some data it will synchronously invoke Lambda function with event batch.

There are two categories of event source mapper: queues and streams.

### Streams

Streams apply to Kinesis and DynamoDB streams. Event source mapping creates and iterator for each shard. It can be configured to start with new items, start from begining or from specific timestamp. Processed items are not removed from the stream.

By default, if your function returns an error, the entire batch is reprocessed until the function succeeds, or items in the batch expire. This is important because having an error in batch can block your processing. So to ensure in-order processing, processing for the affected shard is paused until error is resolved. You can manage this in several ways

- discard old events, discarded events can go to Destination
- restrict number of retries
- split the batch on error, maybe you will have time to process half the batch if its the case of Lambda timeout

### Queues

Its for SQS and SQS FIFO. You have the same idea SQS queue will be polled by Event Source Mapping, and whenever a batch is returned Lambda function will be invoked synchronously. Event Source Mapping will poll SQS using **Long Polling** so its going to be efficient and we can specify the **batch size from 1 to 10 messages**.

For failiures we can use DLQ or Lambda Destination. To use **DLQ we need to set it up on SQS and not on Lambda**. DLQ on Lambda is only for asynchronous invocations.
When error occurs batches are returned to the queue as individual items and might be processed in a different grouping than original batch. Occasionally event source mapping might receive the same item from queue twice even if no error occured.
Lambda will delete items from queue after they are processed successfully.

## Event and Context Objects

Event Object

- JSON formatted document that contains data for the function to process
- Contains information from the invoking service (e.g. EventBridge)
- Lambda runtime converts event to an object
- Example: input arguments, invoking service arguments...

Context Object

- Provides information about invocation, function and runtime environment
- Passed to your function by Lambda at runtime
- Example: aws_request_id, function_name, memory_limit_in_mb...

## Lambda Destination

AWS recommends you use Destinations instead of DLQ because they are more versatile. Unlike DLQ that only sends failed events to SQS or SNS, Destination can be configured to send successful and failed events to some destination.

For asynchronous invocations you can specify following destinations: SQS, SNS, Lambda or EventBridge bus. Event source mapping uses destinations for discarded event batches and you can pick between two destinations SQS or SNS.

## Lambda Execution Role

Lambda functions must have IAM role attached to have permission to access AWS services and resources.

There are some simple managed policies for Lambda that we can use:

- AWSLambdaBasicExecutionRole - Upload logs to CloudWatch
- AWSLambdaKinesisExecutionRole - Read from Kinesis
- AWSLambdaDynamoDBExecutionRole - Read from DynamoDB Streams
- AWSLambdaSQSQueueExecutionRole - Read from SQS
- AWSLambdaVPCAccessExecutionRole - Deploy Lambda function in VPC
- AWSLambdaXRayDeamonWriteAccess - Upload trace data to X-Ray

When we are using event source mapping to invoke function, Lambda will be reading the data so we must use Execution Role to read the data! Best practice is to create one Lambda Execution Role per function.

### Lambda Resource Based Policies

Execution roles are for event source mapping of when our Lambda function needs to invoke other services, but if our function is invoked by other services, then we use resource-based policy.

This gives other accounts or services permissions to invoke your function. So rule is that an IAM principle can access your Lambda function if one of these two things happen:

1. IAM policy attached to the principle authorizes it (e.g. user access)
2. Resource-based policy authorizes it (e.g. service access)

## Environment Variables

Environment variables are key value pairs in a form of a string. They allow you to adjust function behavior without updating code. Lambda Service adds its own system environment variables as well.

Secrets can be encrypted by Lambda service key, or your own CMK.

## Lambda@Edge

Edge functions are functions you write and attach to your CloudFront distribution to execute code closer to your users and minimize latency. CloudFront provides two types of edge functions: CloudFront Functions and Lambda@Edge.

### CloudFront Functions

These are lightweight functions written in JavaScript. They have sub-ms startup time, and can scale to handle millions of requests per second.
They are used to change Viewer requests and responses:

- Viewer Request - after CF receives request from viewer
- Viewer Response - before CF forwards response to viewer

### Lambda@Edge

These are functions written in NodeJS or Python. Yhey are authored in one AWS region, then CF replicates them to its locations. They scale up to thousands of requests per second, and they can change both Viewer and Origin requests and responses.

## Lambda in VPC

By default Lambda functions are launched outside of our VPC, they are in AWS-owned VPC (AWS Cloud). Therefore they can't access resources in our VPC.

You can have Lambda function in your VPC, you need to define VPC ID, subnets and attach security group. Behind the scene Lambda will create ENI (Elastic Network Interface) in your subnets, but to create this ENI your **Lambda function needs VPC Excution Role (AWSLambdaVPCAccessExecutionRole)**.

Lambda function in your VPC does not have internet access, you can give it internate access with NAT gateway or NAT instance. If you want to access some service within AWS Cloud you can also use VPC endpoints to privately access service without NAT.

Note: **Deploying Lambda function in public subnet does not give it internet access or public IP**, this is true for EC2 instance but not for Lambda functions.

## Lambda Function Performance

You increase RAM in 1MB increments from 128MB to 10GB. With more RAM you get more vCPU, so if you have computation heavy application you need to increase RAM. 1792MB of RAM is equivalent of 1 vCPU, so after 1792MB you get more than one CPU, so you need to use multi-threading in your code to benefit from it.

Lambda functions have default timeout of 3 seconds, which can be increased to maximum of 900 seconds (15 minutes).

### Execution context

Execution context is temporary runtime environment that intitalizes any external dependency your lambda code has. Execution context is maintained for some time in anticipation of another invocation, so the next function invocation can re-use the context.

The execution context includes `/tmp` directory which you can leverage to share something between invocations. Lambda functions come with 10GB of disk space, and you may use it if your function needs to download big file to work, or simple needs disk space to perform operations.
Directory content remains when the execution context is frozen, providing transient chache that can be used for multiple invocations.

```py
## BAD - DB connection is established at every invocation
import os

def get_user_handler(event, context)
  DB_URL = os.getenv('DB_URL')
  db_client = db.connect(DB_URL)

  return db_client.get(user_id === event["user_id"])
```

```py
## GOOD - DB connection is established once and re-used across invocations
import os

DB_URL = os.getenv('DB_URL')
db_client = db.connect(DB_URL)

def get_user_handler(event, context)
  return db_client.get(user_id === event["user_id"])
```

## Lambda Layers

New feature that allows us to:

- Create custom runtimes for languages that are not natively supported like C++ or Rust.
- Externalize Dependencies into layers to re-use them across many different lambda functions.

## Lambda File System Mounting

Lambda functions can access EFS file systems if they are running in a VPC. To do so we just configure Lambda to mount EFS file system to a local directory during the initialization. For this to work you must leverage EFS access points feature.

Limitations of this is that for each Lambda instance that comes up, you will have one more connection into EFS file system, so you need to make sure you don't hit connection limit.
Also if you have many different functions at once, as a burst, then you may also hit connection burst limit.

## Lambda Concurrency

Function can be set up to have up to 1000 concurrent executions, if you need more than that you can request more from Amazon. To limit concurrency you need to set `reserved concurrency` at function level. Each invocation over the concurrency limit will trigger Throttle behavior.

Throttle behavior:

- synchronous invocation - will return ThrottleError 429
- asynchronous invocation - will retry automatically and then go to DLQ

### Asynchronous invocations and Concurrency

If function doesn't have enough concurrency available to process all events, additional requests are throttled. In case of Throttling errors Lambda returns the event to the queue (internal EventQueue) and attempts to run function again for up to 6 hours. Retry interval increases exponentially from 1 second to a maximum of 5 minutes.

### Cold Starts and Provisioned Concurrency

Cold starts happen whenever you create a new Lambda function instance. It refers to time it takes to run code outside of handler (init). If init is large the process can take some time, and some users might not be satisfied with your product.
To fix this issue you can provision concurrency in advance, so that cold starts never happen and all invocations have low latency. Application Auto Scaling can manage concurrency.

## Lambda External Dependencies

You need to install the packages alongside your code and zip it together.

- For NodeJS use npm and `node_modules` directory
- For Java include relevant `.jar` files
- For Python use pip --target options

Upload zip straight to Lambda if it's less than 50MB, else upload to S3 first than reference in Lambda.

## Lambda and CloudFormattion

We can use CloudFormattion to upload Lambda function, and there are two ways of doing it.

Number one is **inline**. Inline functions are very simple and they do not and cannot include dependencies. They use `Code.ZipFile` property

```yaml
Description: Lambda Function Inline
Resources:
  Function:
    Type: AWS::Lambda::Function
    Properties:
      Runtime: python3.x
      Role: arn
      Handler: index.handler
      Code:
        ZipFile: |
          import os

          DB_URL = os.getenv("DB_URL")
          db_client = db.connect(DB_URL)

          def handler(evt, ctx)
            return db_client.get(user_id = evt["user_id"])
```

The other way of doing it is through S3. You put your zip file there and reference it in your CloudFormattion template. If you update code in S3, but don't update `S3Bucket`, `S3Key` or `S3ObjectVersion`, CloudFormation won't update your function. This is the reason why bucket versioning is important for this type of deployment.

```yaml
Description: Lambda Function Inline
Resources:
  Function:
    Type: AWS::Lambda::Function
    Properties:
      Runtime: nodejs12.x
      Role: arn
      Handler: index.handler
      Code:
        S3Bucket: my-bucket
        S3Key: function.zip
        S3ObjectVersion: String
```

## Lambda Container Images

You can deploy Lambda function as container image of up to 10GB from ECR. It is used to pack complex and/or large dependencies in a container.
Container base image must implement Lambda Runtime API. There are base images available for Ruby, Python, Node, Java, Go and DotNet. You can create your own base image as long as it implements Lambda Runtime API.

```dockerfile
# Use image that implements Lambda Runtime API
FROM amazon/aws-lambda-nodejs:12

COPY app.js package*.json ./
RUN npm install

CMD ["app.lambdaHandler"]
```

## Lambda Versions and Aliases

So far we worked with **$LATEST** version, this version is mutable which means that you can change it. Once you are satisfied with your changes you can publish your function.

Published functions are immutable so you can't change anything about them. Once published they get their own ARN and version number, which increases with each iteration.

Aliases are _"pointers"_ to Lambda function versions. We can define dev, test and prod aliases and have them point at different lamda versions.
Aliases enable Canary deployment by assigning weights to lambda function. This means that your prod alias can direct 95% of traffic to V1, and 5% of traffic to V2 to test it in prod before fully switching.
Aliases have their own ARN and they cannot reference other aliases.

## Lambda and CodeDeploy

CodeDeploy can help you automate traffic shift for your Lambda function versions. There are three strategies for this:

1. Linear - Grows traffic every N minutes until it reaches 100%
   - Linear10PercentEvery3Minutes
   - Linear10PercentEvery10Minutes
2. Canary - Try X percent then switch to 100%
   - Canary10Percent5Minutes
   - Canary10Percent30Minutes
3. AllAtOnce - Immediate switch to 100%

You can create pre and post traffic hooks to check the health of your Lambda function, and if it's failing you can do a rollback.

## Lambda Function URL

You can expose Lambda function as an API endpoint without going through hustle of setting up API Gateway.

Unique URL endpoint will be generated for you that looks like `https://<url-id>.lambda-url.<region>.on.aws`. You can invoke this URL via browser, curl, Postman or any HTTP client.

Access to your function URL only works through public internet, and you can set up Resource-based Polices and CORS to control that access. You can also use Reserved Concurrency to Throttle your function.

This can be applied to any function alias or to $LATEST, but it can't be applied to specific version.

## Lambda CodeGuru Integration

You can use CodeGuru to gain insight into runtime performance of your Lambda functions. This is supported for Java and Python runtimes. Once activated it will add CodeGuru profiler layer to your function, environment variables and `AmazonCodeGuruProfilerAgentAccess` policy.

## Lambda Limits

Execution:

- Memory allocation ranges from 128MB to 10GB in 1MB increments
- Maximum execution time is 900 seconds or 15 minutes
- Environment variables can take up to 4KB
- There is a disk capacity in function container `/tmp` that can range from 512MB to 10GB
- You can have up to 1000 concurrent executions by default

Deployment:

- Lambda function deployment size cannot exceed 50MB compressed (zipped)
- Size of uncompressed deployment can be up to 250MB
- Size of environment variables can be up to 4KB

## Best Practices

1. Perform heavy-duty work outside of your function handler
   - connect to db
   - initialize AWS SDK
   - pull in dependencies or datasets
2. Use environment variables for:
   - db connection strings, S3 buckets, etc...
   - passwords and other sensitive values you can encrypt with KMS
3. Minimize deployment size
   - Break down function if needed
   - Remember Lambda limits
   - Use Layers where necessary
4. Never have a Lambda function call itself!
