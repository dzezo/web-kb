# DynamoDB

NoSQL serverless database. It's made of **Tables** where each table has a **primary key**. Tables have infinite number of **items** (rows) and each item has **attributes**. Maximum size of an items is 400KB and supported data types are:

- Scalar Types - String, Number, Binary, Boolean, Null
- Document Types - List, Map (nesting)
- Set Types - String Set, Number Set, Binary Set

For primary keys you have a couple of options:

- Option 1: Partition Key (HASH) - Partition key must be unique for each item, like in regular SQL databases, and it needs to be diverse so that data is distributed.
- Option 2: Partition Key + Sort Key (HASH + RANGE) - Combination of these keys must be unique, like composite key in SQL databases. Data in this case is grouped by partition key. Example of this is user-game table, where `user_id` is partition key and `game_id` is sort key. Reason for this is that one user can play many games.

## WCU & RCU (Read/Write Capacity Units) - Throughput

You can control read and write throughput capacity with two available modes:

- Provisioned Mode (default) - In this mode you specify number of reads and writes per second, and you pay for provisioned capacity
- On-Demand Mode - In this mode read and writes scale up and down automatically depending on your workload, and you pay for what you use, so this option can get expensive.

You can always switch between different modes, but you can do that once every 24 hours.

### Provisioned Mode

You must provision RCU and WCU, and there is also an option to setup auto-scaling of throughput to meet demand. You don't have to think hard about RCU and WCU because you can exceeded it temporarily using **Burst Capacity**.
Burst Capacity has its limits and once it has been consumed, you'll get `ProvisionedThrouputExceededException`. In this case it's advised to do an exponential backoff retry.

#### WCU

One WCU represents one write per second for an item up to 1KB in size, if the item is larget than 1KB more WCUs are consumed.

- Example 1: We write 10 items per second, with item size of 2KB, how many WCU are we using?
  `10 * (2KB / 1KB) = 20 WCU`
- Example 2: We write 6 items per second, with item size of 4.5KB, how many WCU are we using?
  `6 * (5KB / 1KB) = 30 WCU` (**KB are always rounded up**)
- Example 3: We write 120 items per **minute**, with item size of 2KB, how many WCU are we using?
  `(120 / 60) * (2KB / 1KB) = 4 WCU`

#### Strongly Consistent Read vs Eventually Consistent Read

Eventho DynamoDB is serverless, there are servers behind the scenes, and every time you write something DynamoDB is going to do replication. Because of this if you read just after write, it's possible to get some stale data.

If you want to get correct data you need to switch from **Eventually Consistent Read** (default) to **Strong Consistent Read** by setting `ConsistentRead` parameter to `true` in API calls. **This will consume twice the RCU** and will increase read latency.

One RCU represents **one Stongly Consistent Read per second**, or **two Eventually Consistent Reads per second**, for an **item up to 4KB** in size. If item is larger than 4KB more RCUs are consumed.

- Example 1: We have 16 Eventually Consistent Reads per second, with an item size of 12KB, how many RCU are we using?
  `(16 / 2) * (12KB / 4KB) = 24 RCU`
- Example 2: We have 10 Strongly Consistent Reads per second, with an item size of 6KB, how many RCU are we using?
  `10 * (8KB / 4KB) = 20 RCU` (**We must round 6KB to 8KB**)

#### Throttling

If we exceed provisioned RCU and WCU we get `ProvisionedThrouputExceededException`. Reasons for this can be:

- Hot keys - one partition key is being read too many times (popular item)
- Hot partition
- Very large item - RCU and WCU depend on item size

Solutions to this exceptions can be:

- Exponential backoff which is already included in SDK
- Distribute partiton keys as much as possible because **RCU and WCU are spread evenly across partitions**.
- If its RCU issue, you can use DynamoDB Acceleration (DAX)

### On-Demand Mode

Reads and writes are automatically scaled with your workload. You don't have to plan your WCU and RCU because you ahve unlimited amount, which means that you won't have issues with Throttling.
Computations for WCU and RCU are the same and you are going to be charged for WRU and RRU (write/read request units).

## Basic Operations

Write Item:

- PutItem - Creates a new item or fully replaces old item (same Primary Key)
- UpdateItem - Edits existing item's attributes or adds new item if it doesn't exist
- Conditional Writes - Accept write, update or delete only if conditions are met, otherwise returns and error.

Read Item:

- GetItem - Read based on Primary Key, by default it is eventually consistent but it can be changed, and you can specify `ProjectionExpression` to retrieve only certain attributes.

Delete Item:

- DeleteItem - Delete an individual item, it also has ability to perform conditional delete.
- DeleteTable - Deletes whole table and all its items, and it's much quicker than calling DeleteItem on all items.

### Reading Data (Query)

Query returns items based on:

- `KeyConditionExpression` - Partition Key value is required, and Sort Key value is option. On Sort Key value you can use `=, <, <=, >, >=, Between, Begins with` operators.
- `FilterExpression` - Additional filtering for **non-key** attributes.

Query result is a list that contains `Limit` (property) number of items, and this list can be up to 1MB in size. To get more data you need to do pagination.
You can query Table, Local Secondary Index or Global Secondary Index

### Reading Data (Scan)

Unlike Query Scan reads the entire table (it doesn't require keys) and then you can filter out data. It returns up to 1MB of data and you can use pagination to keep on reading.

Since it reads entire table it consumes a lot of RCU and is slow. For faster performance you can use **Parallel Scan**. Parallel Scan will allow multiple workers to scan multiple data segments at the same time, which increases both the throughput and RCU consumed.

You can use `ProjectionExpression` to limit returend data attributes and `FilterExpresion` to filter your results. This however doesn't affet RCU.

### Batch Operations

This operations allow you to save in latency by reducing the number of API calls to DynamoDB. Operations are done in parallel for better efficiency.
One thing to Note is that part of batch can fail in which case we need to try again for failed items.

- BatchWriteItem - You can do up to 25 `PutItem` and/or `DeleteItem` in one call, but you can't use `UpdateItem`. You can write 16MB of data and still have the same limit of 400KB of data per item.
- BatchGetItem - You can return items from one or more tables. You can receive up to 100 items and up to 16MB of data. Items are retrieved in parallel to minimize latency.

### PartiQL

PartiQL allows you to select, insert, update and delete data in DynamoDB using SQL. One thing to note is that it doesn't support JOIN.
You can run PartiQL queries from:

- AWS Managment Console
- NoSQL Workbench for DynamoDB
- DynamoDB APIs
- AWS CLI
- AWS SDK

## Conditional Writes

Difference between Filter Expression and Condition Expression is that Condition Expression is for write operations, while Filter Expression is for read queries.

Condition Expression is for write operations: PutItem, UpdateItem, DeleteItem and BatchWriteItem. You have a couple of keywords you can specify to determine which items should be modified:

- attribute_exists
- attribute_not_exists
- attribute_type
- contains (for string)
- begins_with (for string)
- size (string length)
- IN - ProductCategory **IN** (:cat1, cat2)
- between - Price **between** :low **and** :high

Example of item update:

```bash
aws dynamodb update-item --table-name ProductCatalog --key '{ "Id": { "N": "456" } }' --update-expression "SET Price = Price - :discount" --condition-expression "Price > :limit" --expression-attribute-values file://values.json
```

```json
{
  ":discount": {
    "N": "150"
  },
  ":limit": {
    "N": "500"
  }
}
```

## Indexes

There are two types of indexes **Local Secondary Index** and **Global Secondary Index**

### Local Secondary Index (LSI)

LSI gives you **alternative Sort Key** for your table, and attribute from which LSI is created must be scalar (String, Number or Binary) and you can have up to 5 LSI per table.

LSI must be defined at table creation time and it will allow you to query by partition key and alternative secondary key (attribute that you chose for LSI).

### Global Secondary Index (GSI)

GSI gives you **alternative Primary Key** from the base table. GSI can only be scalar attribute (String, Number or Binary) and its purpose is to speed up queries on non-key attributes.

You can create this index after table creation. You must provision RCU and WCU for the index, because its _like_ a new table, but if the writes are throttled on the GSI then the main table will be throttled.

## Optimistic Locking

This is a strategy to ensure item hasn't changed before you update or delete it. Each item has attribute that acts as a **version number** which you can use with a feature called **Conditional Writes** to ensure that update or delete happens only if version is correct.

## DAX

**DAX is** fully-managed, highly available, seamless **in-memory cache for DynamoDB**. To use it you need to provision DAX cluster in advance and you can have up to 10 nodes in your DAX cluster. By default each entry in cache has 5 minutes TTL.

DAX solves _Hot Key_ problem, or too many reads on some popular item, and it doesn't require you to modify your application logic.

What about Amazon ElastiCache? You can use both DAX and ElastiCache at the same time, their use case can be a bit different. DAX is best used for individual objects or query and scan results cache, while ElastiCache can be used for some computationaly heavy aggregations.

## DynamoDB Streams

Whenever you insert, modify or delete an item that modification would be visible in the stream. **Stream represents list of all modifications over time in your table**.

Stream records can be sent to **Kinesis Data Streams** for longer retention because they have 24 hours retention in DynamoDB. They can be read by **AWS Lambda** (Event Source Mapping) and by **Kinesis Client Library** applications.

Use cases for streams are:

- React to changes in real-time, like sending welcome email to a new user
- Perform analytics
- Insert into derivative tables
- Insert into OpenSearch service for indexing which would give search capabilities to DynamoDB
- Implement cross-region replication

You have ability to choose informations that will be written to the stream:

- KEYS_ONLY - only the key attributes of the modified item
- NEW_IMAGE - the entire item, as it appears after modification
- OLD_IMAGE - the entire item, as it appeared before modification
- NEW_AND_OLD_IMAGES - both the new and the old images

One thing to note is that **records are not retroactively populated in a stream after you enable it**.

## TTL

DDB TTL feature allow you to automatically delete items after some time. **TTL attribute must be a Number** data type **with Unix Epoch timestamp** value.

**Items are not deleted immediately** after TTL expires, **but there is a guarantee that items will be deleted within 48 hours** of expiration. Deletion after expiration doesn't consume any WCUs so there is no extra cost.

Expired items are deleted from both GSI and LSI and delete operation for each expired item enters DynamoDB streams.

Use cases for this is to reduce stored data, to manage session data and so on.

## CLI

A few CLI options for DynamoDB:

- `--projection-expression` to select which attributes you want to retrieve
- `--filter-expression` to filter items before returning

To avoid timeouts there are general AWS CLI pagination options

- `--page-size` by default DDB returns up to 1000 items so you may want to split that into multiple API calls.
- `--max-items` max number of items to show in CLI, it returns **NextToken**
- `--starting-token` to specify last **NextToken** to retrieve next set of items

## Transactions

Transactions allow coordinated, all-or-nothing operations to multiple items across one or more tables. They give DDB ACID properties (Atomicity, Consistency, Isolation and Durability).

Transactions consume twice as much WCUs and RCUs because they perform two operations prepare and commit.

There are two transactional operations:

- TransactGetItems - one or more GetItem operations
- TransactWriteItems - one or more PutItem, UpdateItem and DeleteItem operations

## Session State

Most common use case for DDB is to store session state, as a cache. Advantage is that your backend applications can retrieve, store and share session states.

This is something that we've seen with ElastiCache, so DDB and ElastiCache achieve the same purpose. Difference is that ElastiCache is in-memory, while DDB is serverless.

## Partition Strategies

One common strategy to avoid Hot Partition issue is to **add a suffix to Partition Key** value. Suffix will help with better sharding and there are two methods of creating this suffix: Random and Calculated (Hash function)

## Conditional Writes, Concurrent Writes and Atomic Writes

DDB allows concurrent writes, which means that two users can modify the same item. This can be a problem if order of modification is important.
To solve this issue we can use conditional writes, for example user can say _update item only if version is x_.

DDB also has some atomic operations like INCREASE (increment Number attribue) which ofcourse support concurrent writes out of the box.

## Paterns with S3

- Storing Large Objects - There is a limit of 400KB per item in DDB, so to store large objects we can use S3 bucket and then save metadata (S3 object key) in DDB

- Indexing S3 Objects - S3 is made for storing large objects, not for scaning. What we can do is whenever user uploads something to S3 we invoke Lambda function that stores objects metadata in DDB. This allow us to query DDB for objects instead.

## Operations

Table Cleanup:

- Scan and DeleteItem - this is very slow and it consumes alot of RCU and WCU (not recommended)
- DropTable - fast, cheap and efficient

Copying DDB Table:

- AWS Data Pipeline - this uses Amazon EMR Cluster in the background. This cluster is going to scan your DDB table, copy content into S3 bucket, and then use this S3 bucket to populate new table.
- Backup and restore into new table - Only downside is that it take more time
- Custom code - You can write code that scans table and then does BatchWriteItem into new one.

## Security

**VPC endpoints** are available for DDB, so you can access your DB without using the internet, also **access is fully controlled by IAM**. You have **encryption at rest using AWS KMS and in-transit using SSL/TLS**.

As for backup and restore you have **point-in-time recovery** (PITR) like RDS with no performance impact.

You can develop and test apps locally without using DDB web services with DynamoDB Local. There's something called AWS DMS (AWS Database Migration Service) that can be used to migrate to DynamoDB from MongoDB, Oracle, MySQL, S3...

### Fine-grain access

If we have clients that need to access our DDB table directly, then we don't want to give them IAM permissions, roles or users from AWS directly, that would be a security hole.

Instead we're going to use identity provider like Cognito, Google and Facebook to give our users temporary AWS credentials. Idea is that we can use this credentials to optain IAM Role.

This IAM role needs to be heavily restricted to limit API access to DDB. You can achieve this by using **LeadingKeys** condition to limit row-level access for users on the Primary Key, and **Attributes** to limit attributes user can see.
