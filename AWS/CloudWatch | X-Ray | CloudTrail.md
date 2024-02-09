# CloudWatch

## CloudWatch Metrics

CloudWatch provides metrics for every service in AWS. Metric is a variable to monitor (CPU Utilization, NetworkIn...). Dimension is an attribute of a metric (instance id, environment...) and there can be up to 30 dimensions per metric. Metrics have timestamps and belong to namespaces. You can create CloudWatch dashboard of metrics.

### Detailed Monitoring

For example EC2 instance has metrics every 5 minutes, but with detailed monitoring (extra cost) you get data every minute. Use detailed monitoring if you want to scale faster using ASG!

Free tier allows you to have 10 detailed monitoring metrics.

## CloudWatch Custom Metrics

You can define and send your own custom metrics to CloudWatch (RAM usage, disk space, number of logged in users...) using API call `PutMetricData`. You can add dimensions (attributes) to your metric (instance id, environment name...). You can also manipulate Metric resolution by changing `StorageResolution` API parameter. There are two possible values:

1. Standard 1 minute
2. High Resolution 1/5/10/30 second(s) (higher cost)

**Important:** CloudWatch accepts metric data points 2 weeks in the past and 2 hours in the future (`--timestamp` in `put-metric-data`). Make sure to configure your EC2 instance time correctly.

## CloudWatch Logs

This is a place to store application logs on AWS, and to do so you need to define:

1. Log groups - name, usually representing application
2. Log stream - usually represent instances or containers within application
3. Expiration policy - set to never expire or choose range from 1 day to 10 years.)

It is possible to export (send) your logs to:

- S3
- Kinesis Data Stream
- Kinesis Data Firehose
- AWS Lambda
- OpenSearch

Logs are encrypted by default, and you can setup KMS-based encryption with your own keys.

### Sources

We can send logs to CloudWatch Logs using: SDK, CloudWatch Logs Agent which is deprecated in favor of CloudWatch Unified Agent.
Following services will automatically send data to CloudWatch logs:

- Elastict Beanstalk sends logs directly from application
- ECS sends logs directly from containers
- AWS Lambda will send logs from functions
- VPC Flow Logs will send logs specific to your VPC network traffic
- API Gateway will send all the request made to your API Gateway into CloudWatch logs
- CloudTrail can send logs based on filter
- Route53 will log all DNS queries

### Insights

To query logs within CloudWatch you use CloudWatch Logs Insights

### Agents

By default no logs are send to CloudWatch from your EC2 machines. To send logs you need to have IAM Role attached with permissions to send logs into CloudWatch, and install small Linux program called CloudWatch Logs Agent.

There are two types of agents CloudWatch Logs Agent and CloudWatch Unified Agent.

CloudWatch Logs Agent is older version and can only send to CloudWatch Logs.

CloudWatch Unified Agent is a newer version that can additionally collect system-level metrics like RAM, processes... You can use SSM parameter store for centralized configuration of your Unified Agents. Some of metrics you can collect using Unified Agent are:

- CPU (active, idle, system, user, steal)
- Disk metrics (free, used, total)
- Disk IO (writes, reads, bytes, iops)
- RAM (free, inactive, used, total, cached)
- Netstat (number of TCP and UDP connections, net packets, bytes)
- Processes (total, dead, idle, running, sleep)
- Swap space (free, used, used%)

### Metric Filter

You can use filter expresssions to filter your CloudWatch Logs, for example:

- Find specific IP inside of a log
- Count occurences of ERROR in your logs

You can create metrics out of these filters and set up CloudWatch Alarms from them. Filters do not retroactively filter data, they only publish metric data for events that happened after filter was created. When creating Metric Filter you can specify up to 3 Dimensions.

## CloudWatch Alarms

Alarms are used to trigger notifications for any metric. There are 3 alarm states: OK, INSUFFICIENT_DATA and ALARM. Alarms have 3 main targets EC2 instance (stop, terminate, reboot or recover), ASG (trigger auto scalling) and SNS (sends notification to SNS from which you can pretty much do anything).

Alarms are on a single metric, but you can compose alarms using AND and OR conditions to **create composite alarm**. Composite alarms are monitoring states of multiple other alarms.

You can test alarms and notifications by setting alarm state through CLI

```bash
aws cloudwatch set-alarm-state --alarm-name "my-alarm" --state-value ALARM --state-reason "testing"
```

## CloudWatch Synthetics

Script written in Node or Python that monitor your APIs, URLs, Websites... Script should reproduce what your customers do to find issues before your customers do.
It checks availability and latency of your endpoints and can store load time data and UI screenshots. You can set it to run once or on a regular schedule, and if something goes wrong it can trigger CloudWatch Alarm.

## Amazon EventBridge (CloudWatch Events)

With EventBridge you can:

- Schedule cron jobs
- React to event pattern (react to service doing something)
  - S3 Event - upload object
  - EC2 Instance - start instance
  - CodeBuild - failed build

When event happens EventBridge is going to create JSON documents with event details. This event can be sent into many different destinations, for example you can:

- trigger lambda function
- launch ecs task
- start build with CodeBuild
- send message into SQS/SNS or Kinesis Data Stream

EventBridge is default event bus for all AWS related, but there is something called **partner event bus**. There are AWS partners like zendesk, data dog and auth0 that can send their event into partner event bus. This allows you to react to events outside of AWS. You can **create custome event bus** so that your applications can send events.

Event buses can be accessed by other AWS accounts using Resoure-bsed Policies.

# X-Ray

There are two steps to enable X-Ray:

1. Your code must import AWS X-Ray SDK. The application SDK will then capture calls to AWS services, HTTP/HTTPS requests, DB calls (MySQL, PostgreSQL, DynamoDB) and Queue Calls (SQS).
2. We have to install X-Ray deamon or enable X-Ray AWS integration.
   - If we run a machine, on-premise server or EC2 instance, we need to install the deamon. Deamon is little program that works as low level UDP packet interceptor running on Linux, Windows and Mac.
   - If you use services like AWS Lambda that already have integration with X-Ray then they will run deamon for you and you don't have to worry about it.
   - Each application must have IAM rights to write data to X-Ray

## X-Ray Concepts

- Segments - Each application / service will send them
- Subsegments - if you need more details in your segment
- Trace - segments collected together to form an end-to-end trace
- Sampling - decrease amount of requests sent to X-Ray to reduce cost
- Annotations - Key Value pairs used to index traces and use with filters
- Metadata - Key Value pairs, not indexed, not used for searching

X-Ray deamon agent has config to send traces cross acount. This allows to have a central account for all your application tracing.

## Sampling Rules

With sampling rules you control the amount of data you record. You can modify sampling rules without changing your code. By default X-Ray SDK records first request each second, and 5% of any additional requests.
One request per second is the reservoir, which ensures that at least one trace is recorded each second. Five percent is the rate at which additional requests beyond the reservoir size are sampled.

## API

- PutTraceSegments - Uploads segment documents to AWS X-Ray
- PutTelemetryRecords - Used by AWS X-Ray daemon to upload telementry (SegmentsReceivedCount, SegmentsRejectedCount, BackendConnectionErrors...)
- GetSamplingRules - Retrive all sampling rules. This is important for X-Ray daemon to know when to send data into X-Ray
- GetSamplingTargets - Important for X-Ray daemon to know
- GetSamplingStatisticSummaries - Important for X-Ray daemon to know
- GetServiceGraph - to get main graph
- BatchGetTraces - to get list of traces specified by ID, each trace is a collection of segment documents that originates from single request
- GetTraceSummaries - get IDs and annotations for traces available for a specified time frame using an optional filter
- GetTraceGraphs - get service graph for one or more sepficic trace IDs

For these API calls to work X-Ray daemon needs to have IAM policy authorizing the correct API calls.

```json
{
  "Effect": "Allow",
  "Action": [
    "xray:PutTraceSegments",
    "xray:PutTelemetryRecords",
    "xray:GetSamplingRules",
    "xray:GetSamplingTargets",
    "xray:GetSamplingStatisticSummaries"
  ],
  "Resource": ["*"]
}
```

# CloudTrail

CloudTrail allows you to get history of events or API calls made within you AWS Account by: console, SDK, CLI or AWS Services. It is enabled by default and you can put CloudTrail logs into CloudWatch Logs or S3. Trail can be applied to all regions (default) or to single region.

If a resource is deleted in AWS, investigate CloudTrail first!

### CloudTrail Events

There are 3 types of events

1. Management Events
   - Operations that are performed on resources in your AWS account
   - By default, trails are configured to log management events
   - You can separate Read from Write events
2. Data Events
   - By default, data events are not logged because they're high volume operations
   - Amazon S3 object-level activity (ex. GetObject, DeleteObject, PutObject...)
   - AWS Lambda function execution activity (Invoke API)
3. CloudTrail Insights Events
   - It will first analyze how normal managment events look like to establish baseline, then it will start analyzing write events to detect unusual patterns
   - If insight is generated it will appear in CloudTrail console, S3 (optionally) and EventBridge is going to be generated in case automation is needed

### Events Retention

Events are store for 90 days in CloudTrail. To keep events beyond this period, log them to S3 and use Athena for analysis.
