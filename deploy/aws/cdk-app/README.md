# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## Publish to AWS ECR Public

* build image: `docker build -t docqai/docq-rs .`
* tag image for our ECR repo `docker tag docqai/docq-rs:latest public.ecr.aws/q0o2r1k7/docqai/docq-rs:latest`
* AWS auth
  * ACCESS KEY in .aws profile
  * sso: `aws sso login --profile <your sso profile>`
* ECR docker login `aws ecr-public get-login-password --region us-east-1 --profile fabrexp | docker login --username AWS --password-stdin public.ecr.aws/q0o2r1k7`
* `docker push public.ecr.aws/q0o2r1k7/docqai/docq-rs:latest`

## Dockerrun.aws.json ref

<https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/single-container-docker-configuration.html#docker-configuration.no-compose>