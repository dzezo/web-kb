# RDS

RDS stands for Relational Database Service. This is a managed service for databases that use SQL, and it allows you to create following databases:

- Postgres
- MySQL
- MariaDB
- Oracle
- Microsoft SQL Server
- Aurora (AWS database)

We can deploy DB on EC2 ourselves, so what are advantages of using this service:

- Automated provisioning, OS patching
- Continuous backups and restore to specific timestamp (Point in Time Restore)
- Monitoring dashboards
- Read replicas for improved performance
- Multi AZ setup for disaster recovery
- Maintenance windows for upgrades
- Scaling capability (vertical and horizontal)
- Storage backed by EBS (gp2 or io1)

## Scaling

You can increase storage on your RDS DB instance dynamically to avoid manually scaling. To scale you need to set maximum storage threshold, which is maximum limit for DB storage.

You can modify storage on following triggers:

- Free storage is less than 10%
- Low-storage lasts at least 5 minutes
- 6 hours have passed since last modification

## Read Replicas vs Multi AZ

Read replicas help with reading scalability and you can have **up to 15 read replicas**. Replicas can be within AZ, cross AZ or cross Region, since RDS is managed service **cross AZ data transfer is not charged, but cross Region is**. **Replication is ASYNC** which means that reads will be eventually consistent. When we enable read replicas our **aplications need to update connection string to leverage read replicas**.
Replicas can be promoted to their own DB, after which they are going to be taken out of replication system.

Mutli AZ is used for disaster recovery, by default our master DB exist only on one AZ, but we can create failover DB on different AZ which is going to be in sync with master.
Creating failover DB doesn't require master DB downtime, instead master DB snapshot is created and failover DB is re-created from that snapshot, after that **every single change is replicated SYNC**.
What we get out of it is **one DNS name** and in case there is problem with master (loss of AZ, loss of network, storage failure) there will be automatic failover to standby database. This automatic failover **doesn't require manual intervention**.
_Note:_ Read replicas can be setup as Multi-AZ

## Aurora

Aurora is AWS DB technology optimized for cloud. Postgres and MySQL are both supported as AuroraDB (drivers will work as if Aurora was Postgres or MySQL).
Aurora can have **up to 15 replicas** and replication process is blazingly fast (sub 10ms). Failover in Aurora is instantaneous and therefore much faster than a failover from Multi-AZ.

### Availablity and Read Scaling

It keeps 6 copies of your data across 3 AZ (2 copies in each AZ):

- 4 copies out of 6 are needed for writes (if one AZ fails its okay, you can still write)
- 3 copies out of 6 are needed for reads

It has self healing with peer-to-peer replication, and data is striped across 100s of volumes. All this means that risk is heavily reduced.

### Cluster

It has shared storage volume that auto expands from 10GB to 128TB, and your master DB is the only thing that will write to the storage. When master fails it takes around **30 seconds for failover** to take place.
Aurora exposes **Writer Endpoint** (DNS name) which always points to your master DB, as for **replicas** there can be up to 15 of them and they **have auto scaling**, for that reason Aurora provides **Reader Endpoint** (replica load balancer) to connect to read replicas.

### Features

- Automatic failover
- Backup and Recovery
- Isolation and security
- Industry compliance
- Push-button scaling
- Automated Patching with 0 downtime
- Advanced monitoring
- Routine maintenance
- Backtrack - restore data at any point in time without using backups

## RDS & Aurora Security

- At-rest encryption - DB master and replicas encryption using AWS KMS - must be defined at launch time, if master is not encrypted, read replicas cannot be. To encrypt an un-encrypted db, you need to take snapshot encrypt it and restore from it.
- In-flight encryption - every DB on RDS have in-flight encryption enabled by default, your clients must use TLS root certificate from AWS
- IAM authentication
- Security groups
- No SSH available (except on RDS Custom)
- Audit logs can be enabled (and sent to CloudWatch for longer retention)

## RDS Proxy

_Why do you need proxy?_

- Proxy allows you to pool and share DB connections established with database - Your applications can connect to this proxy instead of DB instance itself, which reduces number of connections towards database. Think of lambda functions they can spawn in huge numbers create connection and disappear, this solution will allow you to reuse db connection. This also reduces failover time by up to 66% because only RDS Proxy needs to re-establish new connection towards database.
- It enforces IAM authentication for DB
- RDS Proxy is never publicly accessible (must be accessed from VPC)

# ElastiCache

The same way RDS it to get manged relational databeses, **ElastiCache is** to get **managed in-memory databases** like Redis or Memcached. It is managed because AWS takes care of OS maintenance / patching, optimizations, setup, configuration, monitoring failure recovery and backups.

It's **main purpose is to relieve load from RDS by quering ElastiCache fist** and quering RDS only on cache misses. **Other purpose can be to store user sessions**, this will ensure that user is logged in across all your instances.

## Redis vs Memcached

Redis:

- Multi AZ with automatic failover
- Read replicas to scale reads and have high availability
- Data durability
- Backup and restore features
- Supports sets and sorted sets

Memcached

- Multi-node for partitioning of data (sharding)
- No high availability (replication)
- Non persistent
- No backup and restore
- Multi-threaded architecture

## ElastiCache Strategies

### Lazy Loading / Cache-Aside / Lazy Population

Application make a query to ElastiCache, result can be cache hit or cache miss. In case of cache miss, read is requested from RDS, once data is retrieved it is stored into ElastiCache for future reads.

Pros:

- Only requested data is cached (cache isn't filled up with unused data)
- Node failures are not fatal (just increased latency to warm up the cache)
  Cons:
- Cache miss penalty results in 3 round trips (cache miss, RDS read, ElastiCache write)
- Stale data: data can be updated in database and outdated in cache

### Write Through

When writing to RDS we write into cache as well. You can combine this strategy with lazy loading.

Pros:

- Data in cache is never stale, reads are quick
- Write penalty (each write requires 2 calls)
  Cons:
- Missing Data until it is added/updated
- Cache churn - a lot of data in cache will not get used

### Cache eviction and TTL

Cache eviction can occur in three ways:

- You delete item explicitly from cache
- Item is evicted because memory is full and its not recently used (LRU)
- You set an item time to live (TTL), TTL is helpful for any kind of data and can range from few seconds to hours or days.

# Amazon MemoryDB for Redis

Redis-compatible, durable, in-memory database service. Difference between Redis and MemoryDB for Redis is that **MemoryDB for Redis is database with Redis-compatible API**.

It gives you ultra-fast performance (160 milions request / second), and it scales seamlessly from 10s GB to 100s TB of storage.
It stores data in-memory across up to hundreds of nodes for ultra-fast perfmance, and it store data in multi AZ to provide durability and fast recovery (Multi-AZ Transactional Log)
