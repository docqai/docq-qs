# Infra to deploy DocqAI on AWS

This CDK project deploys an instance of DocqAI to AWS.

This CDK project is design to also generate a CloudFormation template that we can use with a LaunchStack URL.

## LaunchStack URL 

- `cdk synth`
- 


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


## Notes

- EB bucket - EB creates a bucket in an account that launches EB. This is used for assets and logs. The bucket name follows the following convention "elasticbeanstalk-<region>-<account id>"