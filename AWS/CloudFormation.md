# CloudFormation

CloudFormation is declarative way of outlining your AWS infrasturcture, for any resource (most are supported). For example within CloudFormation template, you say:

- i want security group
- i want 2 EC2 machines using this security group
- i want elastic ips for these EC2 machines
- i want an S3 bucket
- i want ELB in front of these machines

and then CloudFormation creates those for you in the right order with exact configuration you specify!

## Benefits

### Infrastructure as a code

- You are not creating resource manually
- Code can be version controlled for example using git
- Changes to infrastructure can be reviewed through code

### Cost

CloudFormation is free you are only charged for underlying structure. Each resource within the stack is tagged with an identifier so you can easily see how much a stack costs you. You can estimate costs of your resources using CloudFromation template.

### Productivity

- Ability to destroy and re-create cloud infra on the fly
- Automated generation of Diagram for your templates
- Declarative programming, no need to figure out ordering and orchestration

### Separation of concerns

You can create many stacks for many apps and many layers. Idea is to reuse as much as possible.

- VPC stacks
- Network stacks
- App stacks

### Don't re-invent the wheel

You can leverage existing templates on the web!

## How it works

Behind the scenes templates are uploaded in S3 and then referenced in CloudFormation. To update a template, we can't edit previous one we have to re-upload new version of the template, and CloudFormation will look into difference and update what is necessary.

Stacks are identified by a name and deleting a stack will delete every single artifact that was created by CloudFormation.

## Deploying templates

There are two ways of deploying templates manual and automated.

Manual way:

- Edit templates in CloudFormation designer
- Using the console to input parameters

Automated way:

- Editing templates in YAML file
- Using AWS CLI to deploy the templates
- Recommended way when you fully want to automate your flow

## Building blocks

### Resources

Resources are **mandatory**, they represent different AWS components that will be created. There are over 220 AWS resources, and you can look them up by search for _AWS Resource Types Reference_.

### Parameters

Parameters are a way to provide inputs to your CloudFormation template. They are important if you want to reuse your templates or when you have some inputs that can't be determined ahead of time.

You should use parameters if your resource configuration is likely going to change in the future.

```yaml
Parameters:
  SecurityGroupDescription:
    Description: Security Group Description
    Type: String # String | Number | CommaDelimitedList | List<T> | AWS Parameter
    # Constraint
    # ConstraintDescription (String)
    # Min/MaxLength (for String)
    # Min/MaxValue (for Number)
    # Defaults
    # AllowedValues (array)
    # AllowedPattern (regexp)
```

You can leverage `Fn::Ref` or `!Ref` function to reference parameter in your template. Note that reference function can be used to reference anything in your template, so you can also use it to reference other resources.

```yaml
DbSubnet:
  Type: AWS::EC2::Subnet
  Properties:
    VpcId: !Ref MyVPC
```

There are also pseudo-parameters provided by AWS in any CloudFormation template:

- AWS::AccountId
- AWS::Region (template region)
- AWS::StackId
- AWS::StackName
- AWS::NoValue
- AWS::NotificationARNs

### Mappings

Unlike parameters these are fixed variables within your CloudFormation template.

```yaml
Mappings:
  RegionMap:
    us-east-1:
      "32": "ami-12345"
      "64": "ami-23456"
    us-west-1:
      "32": "ami-34567"
      "64": "ami-45678"
```

We can use `Fn::FindInMap` or `!FindInMap` function to return value for a specific key.

```yaml
# !FindInMap [MapName, TopLevelKey, SecondLevelKey]
ImageId: !FindInMap [RegionMap, !Ref "AWS::Region", 32]
```

### Outputs

Output section is optional, it declares output values that we can import into other stacks (CloudFormation templates). You can view outputs in AWS Console or in AWS CLI.

For example you can define Network CloudFormation template, and output variables such as VPC ID and Subnet IDs to use in some other templates. You cannot delete stack that is being referenced somewhere else.

```yaml
Outputs:
  StackSSHSecurityGroup:
    Description: SSH Security Group for our Company
    Value: !Ref MyCompanyWideSSHSecurityGroup
    Export:
      Name: SSHSecurityGroup
```

We can use `Fn::ImportValue` or `!ImportValue` in other template to get the output

```yaml
Resources:
  MySecureInstance:
    Type: AWS::EC2::Instance
    Properties:
      AvailabilityZone: "us-east-1a"
      ImageId: "ami-12345"
      InstanceType: "t2.micro"
      SecurityGroup:
        - !ImportValue SSHSecurityGroup
```

### Conditions

Conditions are used to control resource creation or output. They can be whatever you want them to be, but most common ones are: Environment (dev, prod), AWS Region, any parameter value. Each condition can reference another condition, parameter or mapping.

```yaml
Conditions:
  CreateProdResources: !Equals [!Ref EnvType, prod]
Resources:
  MountPoint:
    Type: "AWS::EC2::VolumeAttachment"
    Condition: CreateProdResources
```

Intrinsic logical functions can be any of the following:

- Fn::And
- Fn::Or
- Fn::Not
- Fn::Equals
- Fn::If

### Instrinsic Functions

#### !Ref

Can be used to reference:

- Parameters - returns parameter value
- Resources - returns physical ID of underlying resource

#### !GetAtt

If we want to get more information about our resource we need to use this function. Each resource exposes different attributes and we need to look at the documentation to know what we can get.

```yaml
Resources:
  EC2Instance:
    Type: "AWS::EC2::Instance"
    Properties:
      ## Some properties
  NewVolume:
    Type: "AWS::EC2::Volume"
    Properties:
      ## Some properties
      AvailabilityZone: !GetAtt EC2Instance.AvailabilityZone
```

#### !FindInMap

We can use `Fn::FindInMap` or `!FindInMap` function to return value for a specific key.

```yaml
# !FindInMap [MapName, TopLevelKey, SecondLevelKey]
ImageId: !FindInMap [RegionMap, !Ref "AWS::Region", 32]
```

#### !ImportValue

We can use `Fn::ImportValue` or `!ImportValue` in other template to get the output

```yaml
Resources:
  MySecureInstance:
    Type: AWS::EC2::Instance
    Properties:
      # Some properties
      SecurityGroup:
        - !ImportValue SSHSecurityGroup
```

#### !Join

`Fn::Join` or `!Join` function has following syntax `!Join [delimiter, [coma-delimited list]]`.

`!Join [":", [a, b, c]]` will create `a:b:c`

#### !Sub

This function is used to substitute variable from a text, you can combine this function with References or AWS Pseudo variables.

### Rollbacks

- Stack Creation Fails - Everything rolls back (gets deleted), we have option to disable rollback and troubleshoot what happened
- Stack Update Fails - Stack rolls back to the last known working state

### Advanced Concepts

- **ChangeSets** - By uploading new stack to update existing one we create change set. Change set is going to show all changes that will happen, and we can itterate on this before we execute it.
- **Nested stacks** - These are stacks within other stacks. They allow you to isolate repeated patterns or components into separate stacks (blueprints) and call them from other stacks to recreate resources.
- **Cross stacks** - These are stacks that use export value for other stacks to import. They allow you to reuse stack resources across many different stacks.
- **StackSets** - Admin accounts can create StackSets which can be used to create, update or delete stacks across multiple accounts and regions with a single operation. Trusted accounts can create, update and delete stack instances from StackSets. When you update stack set, all associated stack instances are updated throughout all accounts and regions

### Drift

CloudFormation doesn't protect you against manual configuration changes. Drift is when you manually change configuration of some resource that was created by CloudFormation. To detect this drift we can use CloudFormation Drift feature (doesn't support all resource types)

### Stack Policies

During stack update all update actions are allowed on all resources by default, but sometimes you want to protect some resource from unintentional update, like prod database for example. In that case you need to set Stack Policy.
When you set Stack Policy all resources are protected by default, so you need to have explicit ALLOW for resources you want to update

```json
{
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "Update:*",
      "Principal": "*",
      "Resource": "*"
    },
    {
      "Effect": "Deny",
      "Action": "Update:*",
      "Principal": "*",
      "Resource": "LogicalResourceId/ProductionDatabase"
    }
  ]
}
```
