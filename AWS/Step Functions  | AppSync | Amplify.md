# Step Functions

Step functions allow you to model your workflows as state machines (one state machine per workflow). Workflows are written in JSON and they can be started with SDK call, API Gateway and Event Bridge (CloudWatch Event).

## Task State

Task states are used to do some work in your state machine.

You can invoke AWS service like Lambda function, AWS Batch job, ECS task, you can insert item directly in DynamoDB, publish message to SNS and SQS or even start another Step Function. workflow.

Task can also run one activity. Activity could be EC2 instance polling for some work from Step function and then sending back the results to Step function.

## States

- Choice State - Test for condition
- Fail/Success State - Stop execution with failure/success
- Pass State - Simply pass input to output or inject some fixed data
- Wait State - Provide delay for certain amount of time or until specified time
- Map State - Dynamically iterate steps
- **Parallel State** - Begin parallel branches of execution

## Error handling

Step Functions are particularly useful because of this. Say that we have Lambda function with error handling and retry logic in it. That function may run for very long or timeout for no reason. Instead we can move error handling part to Step Functions and keep Lambda function slim.

Any state can encounter runtime errors for various reasons like:

- State machine definition issue - Choices State has no matching rule
- Task failure - Lambda function exception
- Transient issue - Network partition event

You can use **Retry** to retry failed state, and **Catch** to transition to failure path.

State can report custom or predefined error. Predefined error codes are:

- States.ALL - matches any error name
- States.Timeout - task ran longer than TimeoutSeconds or no hearthbeat received
- States.TaskFailed - execution failed
- States.Permissions - insufficient priviledges to execute code

### Retry

Retry block is evaluated from top to bottom.

- ErrorEquals - match specific kind of error
- IntervalSeconds - **initial** delay before retrying
- BackoffRate - delay multiplier (exponential backoff)
- MaxAttempts - 3 is default, you can se to 0 to never retry

When max attempts are reached Catch block kicks in.

```json
{
  "HelloWorld": {
    "Type": "Task",
    "Resource": "<resource_arn>",
    "Retry": [
      {
        "ErrorEquals": ["CustomError"],
        "IntervalSeconds": 1,
        "MaxAttempts": 2,
        "BackoffRate": 2.0
      },
      {
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 5,
        "MaxAttempts": 5,
        "BackoffRate": 2.0
      }
    ]
  },
  "End": true
}
```

### Catch

Catch block is evaluated from top to bottom. We have following properties at our disposal:

- ErrorEquals - match specific kind of error
- Next - state to send to
- ResultPath - this is how you pass errors into the Next state

## Wait For Task Token

This is a Step Function feature that allows you to **pause Step Functions during Task until Task Token is returned**. Task might wait on other AWS services, human approval or some other 3rd party integration.

In order for Step Function to wait you need to append `.waitForTaskToken` to the Resource field.

```json
{
  "Resource": "arn:aws:states:::sqs:sendMessage.waitForTaskToken",
  "Parameters": {
    "QueueUrl": "https://...",
    "MessageBody": {
      "Input.$": "$",
      "TaskToken.$": "$$.Task.Token"
    }
  }
}
```

In this example we are calling SQS with Task Token, in `TaskToken.$`, so that receiving application knows how to callback our Step Function.
If everything went according to plan application needs to use `SendTaskSuccess` API call in which it needs to pass the results and Task Token. Initial Task Token is returned so that Step Function workflow knows where to continue from.

## Activity Tasks

Activity Tasks enables you to have Task work performed by **Activity Worker**. Activity Worker applications can run on EC2, Lambda, mobile device and more.

Activity Workers are polling for work using `GetActivityTask` API, and after work is completed they need to send success or failure response using `SendTaskSuccess` or `SendTaskFailure` API.

To keep task active you can:

- Configure how long task can wait by setting `TimeoutSeconds`
- Periodically send heartbeats from Activity Worker using `SendTaskHeartBeat`. If you send heartbeats within `HeartBeatSeconds` task will be considered active.

By configuring long `TimeoutSeconds` and actively sending heartbeat, **Activity Task can wait up to 1 year**.

## Standard vs Express

There are two types of workflows Standard (default) and Express.

Standard workflow can have maximum duration of up to 1 year, and you may execute 2000 workflows per second. As for execution history you get up to 90 days in console history, or you can use CloudWatch to have more logs and keep them forever. Pricing is calculated from the number of state transitions. Use case for this type of workflow are non-idempotent actions such as payment processing.

Express workflow can have maximum duration of up to 5 minutes, but you have higher capacity at around 100_000 executions per second. There is no way to track things in console, the only way to track history is through CloudWatch logs. Pricing is calculated from number of executions, their duration and memory consumption. Use cases would be IoT data ingestion or streaming data.

Within express we have asynchronous and synchronous workflows.

Asynchronous workflow doesn't wait for results. Since it doesn't wait for results you can't know if it ended correctly, so oyu need to check CloudWatch logs. This is ideal for scenarios where you don't need immediate response, like messaging services. Execution of this workflow is **At-least-once** so you must manage idempotence, since 1 action can run twice.

Synchronous workflows wait for results, and they can be invoked from API Gateway or Lambda functions. They are **At-most-once**, which means that if there is a failure, Step Function will not restart workflow for you.

# AppSync

This is AWS managed service used to build GraphQL APIs. GraphQL is a new style of API, idea is that you ask for fields that you want and GraphQL returns only those fields. You can combine data from one or more sources into a graph, which means that data sets behind GraphQL can include NoSQL and SQL databases combined together. GraphQL in AppSync has direct integration with DynamoDB, Aurora, OpenSearch and you can get any data from anywhere with Lambda.

Other use case for AppSync is to have real time WebScokets integration.

There are 4 ways you can authorize applications to interact with oyur AWS AppSync GraphQL API:

1. API_KEY - you generate these keys like for API Gateway and give them to users.
2. AWS_IAM
3. OPENID_CONNECT - if you want to have integration with OpenID Connect provider or JSON Web Token
4. AMAZON_COGNITO_USER_POOLS

If you want custom domains or https for your AppSync you need to but it behind CloudFront.

# Amplify

This is a set of tools to get started with creating mobile and web applications. It includes must-have features such as: data storage, authentication, storage and machine-learning, all powered by AWS services.

On backend Amplify relies on DynamoDB, AWS AppSync, Amazon Cognito and S3. It also gives you frontend libraries with ready to use components for React, Vue, iOS, Android, Flutter...

To start amplify project run `amplify init`.

## Features

### Authentication

Amplify comes with authentication out of the box you just need to run `amplify add auth`. It leverages Amazon Cognito for user registration, authorization, account recovery and other auth related operations. It supports MFA, social sign-in and comes with pre-build UI components

### Data store

To add data store run `amplify add api`. It leverages DynamoDB and AppSync, and it has following capabilities:

- realtime capability
- offline capability with automatic synchronization to the cloud without complex code.

### Hosting

To add hosting run `amplify add hosting`. It allows you to:

- build and host web apps
- run CICD (build, test, deploy)
- have pull request previews
- have custom domains
- set up redirects and custom headers
- set password protection

It is very similiar to Netlify and Vercel.

### E2E

You can use Amplify for end-to-end testing since it's well integrated with Cypress testing framework. To run test commands at build time just specify your commands in **test** and **postTest** in `amplify.yml`
