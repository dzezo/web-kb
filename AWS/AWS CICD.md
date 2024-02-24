# AWS CICD

## CodeCommit

This is AWS version control service. Advantage of using CodeCommit over other services such as GitHub, GitLab or Bitbucket is that you have:

- No size limit on repositories
- Code lives and stays within your VPC on AWS Cloud. Which means increased security and compliance.
- It's encrypted and you have access control using IAM
- Integrated with CI tools like Jenkins, CircleCI, AWS CodeBuild and others

Interaction with CodeCommit is done using Git.

Authentication could be done using SSH keys or HTTPS if you want to access using standard login and password, and authorization is done through IAM policies.

Your code is going to be encrypted using KMS, and you also have in-transit encryption using HTTPS or SSH.

## CodePipeline

This is a visual workflow tool that helps you orchestrate your CICD within AWS.

With CodePipeline you can define:

- Source - code in CodeComit, GitHub or Bitbucker, docker image in ECR or perhaps code in Amazon S3
- Build - you can build your code with CodeBuild, Jenkins and other tools
- Test - you can test your code with CodeBuild, AWS Device Farm or some 3rd party tools
- Deploy - you can deploy your build with CodeDeploy, Elastic Beanstalk, CloudFormation, ECS, S3...
- Invoke - you can invoke Lambda or Step functions if needed

Result of each action is stored in S3 as an artifact. That artifact is than used as input for next action.

When you have all these building blocks you can build stages. Each stage can have sequential and/or parallel actions. Example: Build -> Test -> Deploy

If you need to take a look into pipeline action or stage execution state changes you can use CloudWatch Events. You can create events for failed pipelines, cancelled stages and then receive an email notification.

If there is no way for CodePipeline to perform some action, for example to pull code from CodeCommit, then check IAM service role of CodePipeline and make sure it has right IAM permissions. Also, if you need to have a look at some denied
API calls within your infrastructure you can use CloudTrails.

## CodeBuild

CodeBuild allows you to build source from CodeCommit, S3, BitBucket or GitHub. Source needs to have build instructions file called `buildspec.yaml` **in root**. Alternatively there's also an option to insert build instructions manually in console but that's not the best practice.

Build output logs can be stored in S3 or CloudWatch logs, and you can use CloudWatch Metrics to monitor build statistics. You can use EventBridge to detect failed build and trigger notifications, also you can setup CloudWatch alarms to notify if you need tresholds for failures.

Build Projects can be defined within CodePipeline or CodeBuild. CodePipeline can pull existing build project from CodeBuild as well.

If you want to use CodeBuild for testing, there are pre-built images for Java, Ruby, Python, Go, Node, Android, .NET and PHP. If you want to have other environment you can extend Docker image with whatever language you want.

### How it works

We have our source code with `buildspec.yml` file at the top of our repo. CodeBuild is going to fetch this source code, and build a container. To build container CodeBuild will pull a Docker image, which is either prepackaged by AWS or custom made. After build is done container is going to load source code and run instructions from `buildspec.yml`.

You can enable S3 bucket caching if you want to reuse some files from build to build. All the logs are going to be into CloudWatch Logs and S3 if you enable it.

Once CodeBuild is done building your code, or even test your code, it produces some artifacts. These artifacts will be extracted out of the container into S3 bucket. This is where you can find final outputs of CodeBuild.

### buildspec.yml

This file needs to be at the root of your code, and it's made up of following attributes:

- env - Place where you define your environment variables, they can be in plain text, or pulled from SSM Parameter Store or AWS Secrets Manager.
- phases
  - install - install dependencies you may need for your build
  - pre_build - final commands to execute before build
  - build - actual build commands
  - post_build - finishing touches
- artifacts - what to upload to S3
- cache - files to cache to S3 for future build speedup

## CodeDeploy

Service that automates application deployment. You can deploy new application versions to EC2, On-premises servers, Lambda functions, ECS services.

For deployment to work you need to have `appspec.yml` file in root of your project.

### EC2/On-premises

You can perform in-place or blue/green deployments. In order to deploy you need to run **CodeDeploy Agent** on target instances.

If you choose to perform in-place deployment you can define deployment speed by selecting one of the following options:

- AllAtOnce - most downtime
- HalfAtATime - reduced capacity by 50%
- OneAtATime - slowest, but it has lowest availability impact
- Custom - you can define your own %

As for blue/green deployment if you have ALB infront of your ASG, CodeDeploy can be configured to create another ASG of same size that has v2 instances, and at one point switch ALB to point to this new ASG while the old one gets shutdown.

In order for CodeDeploy Agent to work on your instance you need to give your instance permissions to access Amazon S3, because CodeDeploy Agent downloads new versions from S3 bucket.

### Lambda

CodeDeploy can automate traffic shift for Lambda aliases. There are three way in which traffic can be shifted:

1. Linear - grow traffic every N minutes until 100%
2. Canary - try X percent then 100%
3. AllAtOnce - immediately switch traffic (no time for testing)

### ECS

This works similarly to Lambda platform.

Say that we have ALB pointing to a target group attached to our ECS tasks that are running under ECS cluster. We'll use CodeDeploy to perform blue/green deployment by creating new target group with v2 version of our application. This v2 version comes from new ECS task definition that will be run with same capacity as before. Then we need to setup trafic shift strategy for our ALB, and we can choose the same options as before: Linear, Canary or AllAtOnce.

### Rollback

Deployments can be rolled back in two ways:

1. Automatically - rollback happens when deployment fails or when CloudWatch Alarm thresholds are met
2. Manually

If rollback happens CodeDeploy redeploys the last known good revision as new deployment (not restored version).

## CodeArtifact

CodeArtifact is dependency managment tool that works with common dependency managment tools such as Maven, NuGet, npm, yarn, pip and more.

Advantage of CodeArtifact is that once you pull dependency from some tool like npm, for example, it's going to be cached in CodeArtifact repository, and if that dependency gets removed from npm you can still build your application using CodeArtifact.

CodeArtifact has integration with EventBridge so that you can react to events like:

- new package version
- new package created
- package deleted

CodeArtifact can be accessed by Users or Roles within your account with an IAM policy. But if you need to give access to some other account you need to use Resource Policy.

## CodeGuru

This is ML-powered service for automated code reviews and application performance recommendations. It provides two features CodeGuru Reviewer and CodeGuru Profiler.

CodeGuru Reviewer can help you identify critical issues, security vulnerabilities and hard to find bugs. It currently supports Java and Python and integrates with GitHub, Bitbucket and CodeCommit.

CodeGuru Profiler helps you understand runtime behavior of your application, for example identify if your application is consuming excessive CPU capacity. It comes with features like:

- Identify and remove code inefficiencies
- Improve application performance
- Decrease compute costs
- Provide heap summary
- Anomaly detection

CodeGuru Profiler works thanks to an agent. We can configure that agent by tweaking some attributes like:

- MaxStackDepth - If CodeGuru Profiler finds a method A, which calls method B, which calls C, which calls D, then the depth is 4, and if we set `MaxStackDepth` to 2, then the profiler will evaluate only A and B.
- MemoryUsageLimitPercent - the memory percentage used by profiler
- MinimumTimeForReportingInMiliseconds - minimum time between sending reports
- ReportingIntervalInMiliseconds - tells agent how often to report profiling, this is bounded by `MinimumTimeForReportingInMiliseconds`
- SamplingIntervalInMiliseconds - sampling interval that is used to profile sample, by reducing this you have a higher sampling rate

## AWS Cloud9

Cloud9 is cloud-based IDE, which means that it offers code editor, debugger and terminal all in a browser. This allows you to work on your projects from anywhere, and leverage pair programming.
