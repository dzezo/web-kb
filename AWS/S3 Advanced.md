# S3 Advanced

## Lifecycle Rules

Lifecycle rules are made up of:

- Transition Actions - Configure objects to transition to another storage class, for example:
  - Move objects to Standard IA class 60 days after creation.
- Expiration Actions - Configure objects to expire after some time (delete objects after some time), for example:
  - Delete access log files after 365 days
  - Delete old versions of files (if versioning is available)
  - Delete incomlete Multi-Part uploads after X amount of time

Rules can be created for a certain prefix (example: _s3://mybucket/mp3/\*_) or tags (example: _Department: Finance_). You can use Storage Class Analysis to decide when to transition objects to the right storage class. These recommendations only work for Standard and Standard IA and are updated daily, warm up takes 24-48 hours.

### Design Scenarios

Your application on EC2 creates image thumbnails after profile photos are uploaded to S3. These thumbnails can be easily recreated and only need to be kept for 60 days. The source images should be able to be immediately retrieved for these 60 days, afterwards user can wait up to 6 hours, How would you design?

- Source images can be on Standard, with lifecycle configuration to transition them to Glacier after 60 days.
- Thumbnails can be on One-Zone IA, with lifecycle configuration to expire them after 60 days.

Company states that you should be able to recover deleted objects immediately for 30 days. After this time, and up to 365 days, deleted objects should be recoverable within 48 hours

- Enable S3 versioning to preserve deleted objects
- Transition non-current versions of object to Standard IA, after 30 days transition them to Glacier Deep Archive.

## Event notifications

S3 emits events on actions, for example: S3:ObjectCreated, S3:ObjectRemoved, S3ObjectRestore... You can use this actions to do something extra when they happen. For example you can listen to \*.jpg object creation and invoke lambda function to generate thumbnail.

To make events work we need to attach permission to service that is receiving S3 event, for example:

- SNS needs to have SNS Resource (Access) Policy
- SQS needs to have SQS Resource (Access) Policy
- Lambda needs to have Lambda Resource (Access) Policy

All events S3 bucket emits go to **Amazon EventBridge**, from here you can send this events to over 18 AWS services. This EventBridge service allows you to setup advanced filtering options with JSON rules (like object name, size...), send to multiple destinations, replay events...

## Performance

S3 automatically scales to high request rates and latency is 100-200ms. Your application can achieve at least 3500 PUT/COPY/POST/DELETE or 5500 GET/HEAD requests per second per prefix in a bucket.

When it comes to increasing **upload performance** we can do two things **Multi-Part upload and Transfer Acceleration**.

Multi-Part upload is required for files that are larger than 5GB and recommended for those greater than 100MB. When you break file into smaller chunks you can take advantage of parallel uploads to speed up transfer greatly.

Transfer Acceleration helps you increase upload speed by minimizing public internet transfer and maximizing private internet transfer. For example if we have user in USA and bucket in Australia we can transfer file to AWS edge location in USA which will then forward data to target bucket in Australia.

To increase **download performance** we can utilize **Byte-Range Fetches**. This allows you to specify number of bytes you want to retrieve from a file. You can break file into smaller chunks and parallelize GET request.

## S3 Select and Glacier Select

If have to retrieve data from S3 bucket, only to filter it down further on your machine, then you are retrieving too much data and instead you can use SQL to retrieve less data.

## Object Tags and Metadata

When you are creating objects you can also assign metadata. Metadata is just a fancy name for key/value pairs attached to your objects. **User defined metadata must begin with x-amz-meta-**. Metadata can be retrieved while retrieving the object.

Tags are also key/value pairs attached to S3 objects, and their main purpose is to achieve fine-grained permissions (only access specific objects with specific tags).

**You cannot search by metadata or tags**. Instead you must use external DB like DynamoDB as a search index.
