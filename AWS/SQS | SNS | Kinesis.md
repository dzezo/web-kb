# Messaging

There are two types of communications between your services, synchronous and asynchronous.
Synchronous communication is when you talk directly to some service. This type of communication can overwhelm some services in your architecture.
Asynchronous communication is when your services don't talk directly, instead they send events to some queue for later processing.

AWS offers 3 ways of achieving asynchronous communciation

- using SQS - queue model
- using SNS - pub/sub model
- using Kinesis - real-time streaming model

## SQS (Simple Queuing Service)

### Standard Queue

This is oldest AWS offering (over 10 years old), and it is fully managed services used to decouple applications.

Attributes:

- Unlimited throughput
- Unlimited number of messages in queue
- Low latency (< 10ms on publish and receive)
- Limitiation of 256KB per message
- Default message retention is 4 days (maximum is 14 days).
  _Message has to be read by consumer and deleted from the queue before retention period expires, otherwise it will be lost_.
- Can have duplicate messages (at least one delivery).
  _When consumer polls a message, sometimes it will be delivered twice, so that needs to be taken into account when developing an application_.
- Can have out of order messages (best effort ordering)

#### Producing messages

Messages are produces to SQS using the SDK SendMessage API, and they are persisted in SQS unti consumer deletes it. Deleting message from queue is a signal that message has been processed.

#### Consuming Messages

Consumers polls SQS for messages, and it can receive up to 10 messages at a time.

It is important to delete message after processing so that it doesn't get processed again. By deleting you are signaling that processing is completed. If you fail to do so in some amount of time, SQS will send the same event again (perhaps to other instance). This is where at least once delivery is coming from.

When multiple instances are polling messages, SQS sends different batches to them in parallel. This means that we can scale consumers horizontally to improve throughput of processing, which makes SQS with ASG a valid combination.
If we decide to combine SQS with ASG, we need some metric in order to know when to scale. There is a CloudWatch metric for queue length that we can use called `ApproximateNumberOfMessages`.

### Security

#### Encryption

We have 3 types of encryption

1. In-flight encryption using HTTPS API
2. At-rest encryption using KMS keys
3. Client-side encryption if the client wants to perform encryption/decription

#### Access Control

We can use IAM policies to requlate access to SQS API.

#### SQS Access Policies

They are similar to S3 bucket policies and are usefull when we want to **allow other services to write to an SQS queue**, or for **cross-account access** (SQS Queue in one account and EC2 instance in some other for example).

Policy example that allows EC2 instance from other account to poll for messages (Allow to Receive):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": ["ec2-instance-owner-account-id"]
      },
      "Action": ["sqs:ReceiveMessage"],
      "Resource": "sqs-queue-arn"
    }
  ]
}
```

Policy that allows S3 bucket to send events to SQS queue

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "*"
      },
      "Action": ["sqs:SendMessage"],
      "Resource": "sqs-queue-arn",
      "Condition": {
        "ArnLike": {
          "aws:SourceArn": "arn:aws:s3:*:*:bucket1"
        },
        "StringEquals": {
          "aws:SourceAccount": "bucket1-owner-account-id"
        }
      }
    }
  ]
}
```

### Message Visibility Timeout

When consumer polls message it becomes invisible to other consumers. That invisibility lasts for 30 seconds. Which means that consumer has 30 seconds to process and delete message. After 30 seconds message becomes visible to all consumers again.

Now 30 seconds might be small amount of time for some tasks. In such scenarios consumer can request more time by calling `ChangeMessageVisiblity` API to get more time (up to 12 hours). This mechanism is put in place to avoid duplicate processing.

### Dead Letter Queues (DLQ)

DLQ help us avoid infinite loop scenario. This can happen when consumers can't process message within visiblity window and message ends up in a queue again and again.

To avoid this we can set `MaximumReceives` threshold. Once exceeded message goes into DLQ for debugging. Therefore it is recommended to set long retention period to make sure to process messages before they expire.
When our code is fixed, we can bring messages back from DLQ using **Redrive to Source** feature.

DLQ type must correspond to source queue type (FIFO -> DLQ FIFO, Standard -> DLQ Standard).

### Delay Queues

We can set delay to messages so that consumers don't see them immediately. Delays can be up to 15 minutes, and by default they are 0 seconds (available right away). We can set default at queue level, and override the default at message level using `DelaySeconds` parameter when sending.

### Important Concepts

#### Long polling

When consumer requests messages from empty queue, it can optionally wait for messages to arrive. This is called long polling.

Long polling decreases number of API calls made to SQS and decreases latency because messages get sent immediately when they arrive. Wait time can be up to 20 seconds, and it can be set at the queue level or at the API level using `ReceiveMessageWaitTimeSeconds`.

#### Extended Client

Sometimes we need to send something larger than 256KB to our consumers. We can do this by using **SQS Extended Client** (Java library).
This sends large message to S3 bucket and small metadata message (a pointer to S3 message) to SQS queue, receiver will infer S3 message location from SQS metadata message.

#### Must know API

- CreateQueue - here you can use `MessageRetentionPeriod` to set how long a message should be kept in queue before it is discarded
- DeleteQueue
- PurgeQueue - deletes all message within a queue
- SendMessage - you can send messages with a delay using `DelaySeconds` parameter
- ReceiveMessage - to do polling
- DeleteMessage - to complete processing
- MaxNumberOfMessages - you can tune this `ReceiveMessage` API property to receive up to 10 message from SQS queue (by default it is 1)
- ReceiveMessageWaitTimeSeconds - tells how long polling should last
- ChangeMessageVisiblity - changes the message timeout in case you need more time for processing

There are Batch API calls for SendMessage, DeleteMessage, ChangeMessageVisiblity which can help in decreasing your costs.

### FIFO Queues

This is First In First Out queue, which means that ordering is way better than that of standard queue. Because we have this ordering constraint, throughput is limited to 300 messages per second without batching, and 3000 messages per second if you are sending batches. This queue also has **exactly-once** send capability by removing duplicates.

When creating FIFO queues name must end in `.fifo`.

#### Deduplication

Deduplication period is 5 minutes, which means that if two identical messages are sent within 5 minutes, second will get rejected. There are two deduplication methods:

1. Content-based - uses SHA-256 hash to determine if message body is different
2. Message Deduplication ID

#### Message Grouping

If you specify the same value for **MessageGroupID** (which is mandatory) in SQS FIFO queue, than you can only have one consumer and all message will be in order.

If you want to process many message at once and you don't care about order on a queue level, then you can specify different values for MessageGroupID and messages will be ordered in their respective groups.

Example is that you just care about message order for specific customerID, and you can use customerID as MessageGroupID.

## SNS

When you want to send one message to many receivers at once, you have two options:

1. Create direct integrations with receivers, which doesn't scale well
2. Implement Pub/Sub pattern

SNS is a service for setting up Pub/Sub pattern, and it works like this:
_Event producer_ sends message to **SNS topic**, and _event receivers_ that are subscribed to that topic will receive that message. Subscribers will get all messages that are sent to the topic (there is a new feature to filter messages **Filter Policy**). You can have up to 12.5 milion subscribers and 100k topics.

SNS can receive from and send messages to many AWS service, you can also send emails and mobile notifications directly from SNS.

To publish message to SNS you can use **Topic Publish**. You create topic and one or many subscriptions, and you simply publish to created topic.

There is also something called **Direct Publish** for mobile apps. You need to create platform application, platform endpoint and publish into platform endpoint. It works with many different ways in which your mobile app can receive notifications like: Google GCM, Apple APNS, Amazon ADM...

### Security

It provides same security as SQS:

- Encryption
  - In-flight using HTTPS API
  - At-rest using KMS keys
  - Client-side
- Access Controls - IAM policies to regulate access to SNS API
- SNS Access Policies
  - for cross-account access
  - for allowing other services to write to an SNS topic

## Kinesis

### Kinesis Data Streams

KDS is a way of streaming big data into your systems.

**KDS is made of multiple shards**, and each shard is numbered. **Number of shards** is something you provision ahead of time, and this number **defines your streaming capacity**.

Producers (applications, desktop or mobile clients) send data into KDS using AWS SDK or Kinesis Producer Library (KPL). Data is called record, and **record is made of two things partition key and data blob**.
Partition key defines in which shard record will go to, and data blob is value itself which can be up to 1MB in size.
Producers can send data at a rate of 1MB per second per shard, which means that if you have 6 shards you get 6MB per second.

Once data is in KDS it can be consumed by many consumers. When **consumer** receives a record, it **receives partition key, sequence number and data blob**. Sequence number represents where record was in a shard.
For consumtion rate we have **2MB per second per shard shared** for all consumers. If you enable **enhanced consumer mode** you will get **2MB per second per shard per consumer**.

#### Properties of KDS

Retention between 1 to 365 days, which means that you have default ability to reprocess (**replay**) data. Once data is inserted in Kinesis it can't be deleted (**immutability**). Data that shares same partition key goes to the same shard (**ordering**).

Producers can send data using: AWS SDK, Kinesis Producer Library (KPL) or Kinesis Agent. You can write your own consumers using Kinesis Client Library (KCL) or AWS SDK, or use managed consumers AWS Lambda, Kinesis Data Firehose or Kinesis Data Analytics.

#### Capacity modes

- Provisioned

  - You choose number of shards provisioned, adn you scale them manually or using API
  - Each shard gets 1MB/s in (or 1000 records per second)
  - Each shard gets 2MB/s out
  - **You pay per provisioned shard per hour**.

- On-Demand
  - No need to provision or manage capacity
  - Default capacity provisioned is 4MB/s in (or 4000 records per second), and it will scale automatically based on observed throughput peak during last 30 days.
  - **Pay per stream per hour and data in/out per GB**

#### Security

Kinesis Data Streams is **provisioned within a Region**. You can **control access to produce and read from shard using IAM policies**. There is **in-flight (HTTPS), at-rest (KMS) and client-side encryption**. **VPC endpoints are available** for Kinesis, this allows you to access Kinesis directly from EC2 instance in a private subnet. You can use **CloudTrail to monitor your API calls**.

### Kinesis Producers

Records consist of sequence number which is unique per partition-key, partition key which we must specify and data blob that can be up to 1MB in size.

Producers can be anything from AWS SDK to create simple producer to KPL which is built on top of AWS SDK and provides some advanced features like batching and retries.

API to send records into Kinesis is called `PutRecord`, and we can use batching with PutRecords API to reduce costs and increase throughput.

It is important to pick well distributed partition-key like customerID for example, because partition-key is fed into hash function which figures out to which shard it should send data to. If we use browser type as a partition-key for example, we might get something called **hot-partition**.

Hot-partition happens when we overwhelm shard with traffic, in our case most users are using Chrome browser and therefore shard that receives data for it will get overwhelmed.

This brings us to `ProvisionedThroughputExceeded` exception which happens when we are over producing into a shard. Solutions for this exeception are:

1. User well distributed partition-key
2. Implement retries with exponential backoff
3. Scale number of shards

### Kinesis Consumers

Consumers get data records from data streams and process them, they can be:

- AWS Lambda
- Kinesis Data Analytics
- Kinesis Data Firehose
- Custom Consumer implemented using AWS SDK in classic or enchanced fan-out mode
- Consumer implemented using Kinesis Client Library which simplifies reading from data stream.

#### Consumer types

- Clasic Fan-out Consumer (pull)

  - Good if you have low number of consuming applications
  - Read throughput is 2MB/s per shard shared across all consumers
  - Latency is ~200ms
  - Consumer polls data from Kinesis using `GetRecords` API call with cap of 5 `GetRecords` API calls per second

- Enhanced Fan-out Consumer (push)
  - Good if you have multiple consuming applications for the same stream
  - 2MB/s per consumer per shard
  - Latency is ~70ms, this is because Kinesis pushes data to consumers over HTTP/2 (`SubscribeToShard` API)
  - There is a limit of 5 consumer applications per data stream, you can request quota increase from AWS if you need more.

#### AWS Lambda

Supports both classic and enchanced fan-out consumers so you can say how you want to consume data from KDS. It will read record in batches, and you can configure batch size and batch window, and it will retry if there is an error. You can process up to 10 batches per shard simultaneously.

### Kinesis Client Library

KCL helps you read records from Kinesis Data Stream with distributed applications sharing read workload. Shard is to be read by only one KCL instance, but one KCL instance can read multiple shards. Progress is checkpointed into DynamoDB, so your application running KCL will need IAM access to DynamoDB. Thanks to DynamoDB your app will be apple to track other workers and share work amongst shards. Records read are in order at shard level.

- KCL 1.x (supports shared consumer)
- KCL 2.x (supports shared & enhanced fan-out consumer)

### Kinesis Operations

#### Shard spliting

Split shard in two to increase stream capacity (+1MB/s data in per shard). This is usefull if we have hot shard. When we divide a shard, two new shards are produced and the old (original) one is closed and will be deleted once data in it expires.
There is no automatic scalling, capacity needs to be managed manually. You can't split shard into more than two shards in one go.

#### Shards Merging

This is oposite operation, to decrease capacity and save costs. Can be used to group two low traffic (cold) shards into one (you can't merge more than two shards in single operation). Old shard is closed and deleted once data in it expires.

### Kinesis Data Firehose

Takes record data (up to 1MB per record) from different producers, optionally does data transformation using lambda functions, and then writes data in batches to these desitinations:

- 3rd party Partner Destinations - Datadog, mongoDB...
- AWS Destinations - Amazon S3, Amazon Redshift, Amazon OpenSearch
- Custom Destinations - HTTP Endpoint

Once you data is sent you have option to save all or failed data in S3 backup bucket.

#### Kinesis Data Streams vs Kinesis Data Firehose

KDS

- Streaming service used to ingest data at scale
- You write your own producers and consumers
- Its real-time
- Managed scaling (shard splitting and merging), you pay for how much you provision
- Data storage (1 - 365 days)
- Support data replay

KDF

- Service to load streaming data into
  - S3
  - Redshift
  - OpenSearch
  - 3rd party
  - Custom HTTP Endpoint
- Fully managed
- Auto scalling
- Near real-time (KDF waits for buffer to get filled before it sends data, or it waits buffer interval)

### Kinesis Data Analytics

#### For SQL Applications

Two data sources KDA is able to read from are Kinesis Data Stream and Kinesis Data Firehose. You can then apply SQL statements to those reads to perform real-time analytics. Its also possible for you to join some reference data by referencing it from S3 bucket. This will allow you to enrich data in real-time. Then you can send data to two destinations Kinesis Data Stream and Kinesis Firehose.

#### For Apache Flink

Flink are special applications you need to write. You can run these Flink applications on the cluster that's dedicated to it behind the scenes on Kinesis Data Analytics. With Apache Flink you can read from two main data sources Kinessis Data Stream and Amazon MSK.

So with this service you run any Flink application on managed cluster and idea is that Flink is going to be a lot more powerful than just standard SQL. So if you need advanced querying capability, or to read streaming data from other services such as Kinesis Data Streams or Amazon MSK, which is Amazon managed Kafka, then you would use this service.

With this service you get:

- Automatic provisioning of compute resources, parallel computation and automatic scalling
- Application backups
- You can use any Apache Flink programming features
