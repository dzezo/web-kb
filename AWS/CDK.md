# Cloud Development Kit (CDK)

Allows you to define cloud infrastructure using familiar language like: JavaScript/Typescript, Python, Java and .Net.

Main downside of CloudFormation template is that it's written in YAML or JSON which are not typesafe, by using CDK you ensure type safety.
CDK contains high level components called **constructs** that you can use to define your stack. This code is ultimately going to be _"compiled"_ down into CloudFormation template using CDK CLI `cdk synth` command.

```sh
# Install the CDL
npm i -g aws-cdk-lib

# Init application
cdk init app --language javascript

# Before we deploy our stack, we need to bootstrap CDK
# Bootstraping is done once per region, per account
cdk bootstrap

# Create template
cdk synth

# Deploy stack
cdk deploy

# DESTROY stack
cdk destroy
```

## Constructs

CDK Construct is a component that encapsulates everything CDK needs to create the final CloudFormation stack. Construct can represent single AWS resource, like S3 bucket, or multiple related resources.

AWS Construct library is a collection of Constructs included in AWS CDK which contains Constructs for every AWS resource. There are 3 different levels of Constructs available: L1, L2 and L3

Construct Hub contains additional Constructs from AWS, 3rd parties and open-source community.

### L1

These Constructs represents all resources that are directly available in CloudFormation. Their name starts with **Cfn** and when you define them you need to specify all required properties for that resource.

```ts
const bucket = new s3.CfnBucket(this, "MyBucket", {
  bucketName: "MyBucket",
});
```

### L2

Similar to L1 but with convenient defaults and boilerplate. They provide methods that make it simpler to work with the resource like `bucket.addLifeCycleRule()`

```ts
const bucket = new s3.Bucket(this, "MyBucket", {
  versioned: true,
  encryption: s3.BucketEncryption.KMS,
});

// Some convenient method
const objectUrl = bucket.urlForObject("MyBucket/MyObject");
```

### L3

These are called patterns because they represent multiple related resources. This help you complete common tasks easily.

```ts
const api = new apigateway.LambdaRestApi(this, "myapi", {
  handler: backend,
  proxy: false,
});

const items = api.root.addResource("items");
items.addMethod("GET"); // GET /items
items.addMethod("POST"); // POST /items

const item = items.addResource("{item}");
item.addMethod("GET"); // GET /items/{item};
item.addMethod("DELETE", new apigateway.HttpIntegration("http://amazon.com"));
```

## Testing

You can test CDK apps by using **CDK Assertions Module** combined with popular test frameworks for your prefered language (Jest for Javascript).

There are two types of tests: **Fine-grained Assertions** and **Snapshot Tests**. Fine-grained Assertions test specific aspect of CloudFormation template, for example to check if resource has some property with some value. Snapshot Tests test synthesized CloudFormation template against previously stored template.

To prepare/import template for assertions we can do two things:

1. Template.fromStack(MyStack) - This is for stacks built in CDK
2. Template.fromString(myString) - This is for stacks built outside of CDK

```js
test("synthesizes the way we expect", () => {
  const template = Template.fromStack(MyStack);

  template.hasResourceProperties("AWS::Lambda::Function", {
    Handler: "handler",
    Runtime: "nodejs14.x",
  });
  template.resourceCountIs("AWS::SNS::Subscription", 1);

  expect(template.toJSON()).toMatchSnapshot();
});
```
