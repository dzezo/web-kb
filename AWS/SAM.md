# SAM (Serverless Application Model)

SAM is a framework for developing and deploying serverless applications. All configuration is done using YAML, and these SAM YAML file is then used to generate complex CloudFormation template. You can also use SAM with CodeDeploy to deploy Lambda functions and shift traffic gradually between versions.

SAM deployment process goes like this:

1. You build application locally using `sam build` command, this will turn your SAM template into CloudFormation template
2. You then package this output by running `sam package` (or `aws cloudformation package`), this will zip CloudFormation template with application code and upload it to S3 bucket
3. You deploy by running `sam deploy` (or `aws cloudformation deploy`), this will create or execute ChangeSet on CloudFormation to create CloudFormation Stack (serverless stack that can be made of Lambda, API Gateway and DynamoDB)

To build, test and debug your serverless applications locally you can use SAM CLI. SAM CLI with AWS Toolkit will provide you with lambda-like execution environment where you can step-through your Lambda function and debug your code.

To initialize new SAM project you run `sam init` command. This will give you among many thing SAM YAML configuration file. Important thing to remember about this file is that you have 3 SAM specific resources at your disposal:

- AWS::Serverless::Function - Lambda function
- AWS::Serverless::SimpleTable - DynamoDB table
- AWS::Serverless::API - API Gateway

Example of SAM Template

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Transform: "AWS::Serverless-2016-10-31" # Indicates that this is a SAM Template
Description: A starter AWS Lambda function
Resources:
  helloworld:
    Type: "AWS::Serverlesss:Function"
    Properties:
      Handler: app.lambda_handler # [file_name].[function_name]
      Runtime: python3.6
      CodeUri: src/ # where file is located locally
      MemorySize: 128
      Timeout: 3
```

To deploy SAM project first we need to write some commands.

```sh
# create S3 bucket
aws s3 mb s3://my-sam-bucket

# package cloudformation
aws cloudformation package --s3-bucket my-sam-bucket --template-file template.yaml --output-template-file dist/template.yaml

# deploy template
aws cloudformation deploy --capabilities CAPABILITY_IAM --template-file dist/template.yaml --stack-name my-sam-stack
```

## API Gateway

First you need to properly respond from Lambda function so that API Gateway can understand your response

```py
import os
import json

def respond(err, res = None)
  return {
    'statusCode': '400' if err else '200'
    'body': err.message if err else json.dumps(res)
    'headers': {
      'Content-Type': 'application/json'
    }
  }

def lambda_handler(evt, ctx)
  print('Received event: ' + json.dumps(evt, indent=2))
  return respond(None, res="Hello world")
```

Then in our template file we can add Event to invoke our Lambda function.

```yaml
Resources:
  helloworld:
    Type: "AWS::Serverlesss:Function"
    Properties:
      Handler: app.lambda_handler
      Runtime: python3.6
      CodeUri: src/
      MemorySize: 128
      Timeout: 3
      # Invoke function when GET /hello is triggered
      # API Gateway will be created if it doesn't exist
      Events:
        HelloWorldAPI:
          Type: Api
          Properties:
            Path: /hello
            Method: GET
```

## DynamoDB

```py
import os
import json
import boto3

region_name = os.environ['REGION_NAME']
table_name = os.environ['TABLE_NAME']

# create ddb client outside of handler
dynamo = boto3.client('dynamodb', region_name=region_name)

def lambda_handler(evt, ctx)
  scan_res = dynamo.scan(TableName=table_name)
  return response(None, res=scan_res)
```

From this function body we can see that we need to provide `region_name` and `table_name` environment variables, create DynamoDB table and give this function access to table by attaching policy.

Example of how config file would look like in this scenario.

```yaml
Resources:
  helloworld:
    Type: "AWS::Serverlesss:Function"
    Properties:
      Handler: app.lambda_handler
      Runtime: python3.6
      CodeUri: src/
      MemorySize: 128
      Timeout: 3
      Environment:
        Variables:
          TABLE_NAME: !Ref helloworldtable
          REGION_NAME: !Ref AWS::Region # Parameter provided by AWS CloudFormation templates
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref helloworldtable
      Events:
        HelloWorldAPI:
          Type: Api
          Properties:
            Path: /hello
            Method: GET
  helloworldtable:
    Type: AWS::Serverless::SimpleTable
    Properties:
      PrimaryKey:
        Name: greeting
        Type: String
      ProvisionedThroughput:
        ReadCapacityUnits: 2
        WriteCapacityUnits: 2
```

## SAM Policy Templates

There is list of SAM policy templates we can use to give permissions to our Lambda function. Some important examples:

- S3ReadPolicy - Gives read only permissions to objects in S3
- SQSPollerPolicy - Allows to poll SQS queue
- DynamoDBCrudPolicy - Allows CRUD operations on DynamoDB table

## Local Capabilities

With SAM CLI you can locally start Lambda function by running `sam local start-lambda`, this is going to expose your lambda function as a local endpoint. You can also invoke lambda function by running `sam local invoke`, this will invoke function with payload once and quit after invocation completes. In case your Lambda function is interacting with AWS by making API calls to DynamoDB, make sure to set proper environment by using `--profile` option.

You can also start an API Gateway endpoint by runing `sam local start-api`, this will start local HTTP server that hosts all your functions. Changes to functions will cause automatic reload.

Another thing you can do is generate AWS Events for your Lambda function by running `sam local generate-event`. After you generate an event you can pipe it as invoke command input.

```sh
sam local generate-event s3 put --bucket someBucket --key someKey | sam local invoke -e function_logical_id
```
