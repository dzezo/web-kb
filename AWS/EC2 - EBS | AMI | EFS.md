# EC2 Instance Storage

## EBS (Elastic Block Store)

**Analogy:** Think of them as '**network USB stick**'

This is network drive you can attach to your EC2 instance and it allows you to persist data even after termination. You can control persistance through `termination attribute` which is by default set to true for root volume (delete on instance termination), and false for other attached EBS volumes (persist on instance termination).

One EBS can only be mounted to one EC2 instance, but one EC2 instance can have multiple EBS attached.

Since this **drive uses network to communicate** there will be **slight latency**. Good thing about this kind of drive is that it can be detached from one EC2 instance and attached to another really quickly.
EBS are bound to specific AZ (availablity zone), this means that you can't have EBS volume in `us-east-1a` attach to EC2 instance in `us-east-1b`. To move EBS across AZ you first need to snapshot it!

When you are selecting EBS you need to declare size in GBs and IOPS (capacity), and you will get billed on provisioned capacity. There is also option to increase capacity over time.

_Free tier: 30GB of free EBS storage fo type General Purpose (SSD) or magnetic per month_

### EBS Snapshots

EBS Snapshots are used to make a backup (snapshot) of your EBS volume at a point in time. It is recommended to detach your volume before you do a snapshot.

You can use this snapshot to move EBS across AZ or region. What you are essentially doing is creating a backup and then restoring it in another AZ or region

Features:

- EBS Snapshot Archive - This is will move your snapshot to _archive tier_, which means that restoring would take a long time (24-72 hours), but it will be 75% cheaper
- Recycle Bin for EBS Snapshots - You can setup rules to retain deleted snapshots so that you can recover them in case of accidental deletion, and retention can vary between 1 day up until 1 year.
- Fast Snapshot Restore (FSR) - Force full initialization of snapshot to have no latency on first use.

## AMI (Amazon Machine Images)

AMI are customization of an EC2 instance, you can use AMI provided by AWS like Amazon Linux 2 AMI, or you can make your own.
When creating your own AMI you can specify OS, monitoring tools and many more things, this will in turn make for faster boot/configuration time since all software that we need will be pre-packaged. **AMI are built for specifc region** and can be copied across other regions.
You can launch EC2 instance from:

- Public AMI: AWS provided
- Your own AMI
- AWS Marketplace AMI: AMI someone else made (and potentially sells)

### Creating AMI

1. Launch EC2 instance on lets say `us-east-1a`
2. Customize
3. Stop the instance (for data integrity)
4. Build an AMI from instance (this will create EBS snapshots)
5. Now on lets say `us-east-1b` we can launch instance from our AMI, this will essentially copy our EC2 instance to different AZ

## EC2 Instance Store

EBS volumes are network drives and with that comes some performance penalty, if you need high-performance storage, use EC2 Instance store. These are real hard-drives attached to server that is hosting your EC2 instance.

EC2 Instance characteristics:

- Better I/O performance
- If they are stopped they lose their storage (ephemeral), which makes them good for buffers and cache
- If hardware fails you are going to lose data
- Backups and Replication are your responsibility

## EBS Volume Types

EBS volumes are characterized in size, throughput(amount of data) and IOPS and they come in 6 types:

- gp2/gp3 - general purpose SSD volume that balances performance and price
- io1/io2 - high performance SSD volume, which means low latency and high throughput workloads
- st1 - low cost HDD volume designed for frequently accessed, throughput intensive workloads
- sc1 - lowest cost HDD volume for less frequently accessed workloads

**Only gp2/gp3 and io1/io2 can be used as boot volumes**

### General Purpose SSD

This is cost effective low latency storage which you can use for system boot, virtual desktops, development and test environments. Size can vary from 1GB to 16TB.

gp3 (newer generation)

- Baseline: 3000 IOPS and throughput of 125MB/s
- Limit: 16000 IOPs and throughput of 1000MB/s
  gp2
- Small gp2 volumes can burst up to 3000 IOPS
- Size of the volume and IOPS are linked, maximum is 16000 IOPS and you gain 3 IOPS per GB, which means that you are at max IOPS once your volume is 5334GB

### Provisioned IOPS (PIOPS) SSD

These are great option for applications that require sustained IOPS performance or more than 16000 IOPS. They **support EBS multi-attach**

io1/io2 (4GB to 16TB)

- Max PIOPS is 64000 for Nitro EC2 instances, its 32000 for others
- You can increase PIOPS independently from storage
- io2 have more durability and more IOPS per GB at the same price as io1, so they are go to

io2 Block Express (4GB - 64TB)

- sub milisecond latency
- Max PIOPS 256000

### Hard Disk Drives (HDD)

These drives cannot be a boot volume. They range between 125GB to 16TB

st1 (t - Throughput optimized)

- For big data, data warehouses, log processing
- Max throughput: 500MB/s
- Max IOPS: 500

sc1 (c - Cold hdd)

- For archives and data that is infrequently accessed
- Max throuput: 250MB/s
- Max IOPS: 250

## EBS Multi-Attach

Multi-Attach allows you to **attach same EBS volume to multiple EC2 instances in the same AZ**. Each instance will have full read and write permissions to high-performance volume (io1 and io2). **One EBS can be attached to 16 EC2 instances** at a time. This is useful when your application must manage concurrent write operations.

## EFS (Elastic File System)

This is NFS (network file system) that can be mounted on many EC2 instances. Huge advantage is that it can work with EC2 instances in multiple AZ. It is highly available, scalable and expensive, but it doesn't require capacity planning because **it is pay-per use**, which means that **it scales automatically**.

- **Compatible with Linux based AMI (not Windows)**
- Uses security group to control access
- Encryption at rest using KMS
- POSIX file system (~ Linux) that has standard file API

### Performance and Storage Classes

- Scale - Thousands of concurrent NFS clients with 10GB/s throughput, and it can grow to PB scale NFS automatically.
- Performance - You can set this at EFS creation time
  - General Purpose (default) - for latency sensitive use cases like web server
  - Max IO - higher latency but with increased throughput for big data and media processing
- Throughput Mode
  - Bursting - throuput grows with storage size
  - Provisioned - set your throughput regardless of storage size
  - Elastic - automatically scales throughput up or down based on your workloads, which is great for unpredictable workloads
- Storage Tiers (**lifecycle managment feature - move file after N days**)
  - Standard: for frequently accessed files
  - Infrequent access (EFC-IA): it will cost to retrieve files, but it will be cheaper to store them. You enabled EFS-IA with a lifecycle policy. For if your file hasn't been accessed in over 60 days, lifecycle policy will kick in and move your file into EFS-IA
- Availability
  - Standard - Multi AZ, great for production
  - One Zone - One AZ, great for development

## EBS vs EFS

EBS:

- one instance (exept multi-attach io1/io2)
- locked into AZ
- gp2 - IO increases with disk size
- io1 - IO increases independently
- migration across AZs done through snapshots
- root EBS volume get terminated with EC2 instance (you can change this)

EFS

- 100s of instances
- not locked into AZ
- only for Linux instances
- EFS is more expensive, you can mitigate with EFS-IA
