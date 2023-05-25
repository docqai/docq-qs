import { CfnOutput, CfnParameter, Stack, StackProps } from "aws-cdk-lib"; //cdk v2
import { Construct } from "constructs";

//import * as AppRunnerCfn from "aws-cdk-lib/aws-apprunner";
//import * as AppRunner from "@aws-cdk/aws-apprunner-alpha"; // cdk v2 doesn't have proper L2 constructs yet

import * as efs from '@aws-cdk/aws-efs';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';
import * as ecr from '@aws-cdk/aws-ecr';
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { env } from "process";

export const environmentTier =  {
  WebServer : {name: 'WebServer', type: 'Standard'},
  Worker : {name: 'Worker', type: 'SQS/HTTP'},
}


export class DocqStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    //const defaultVpc = Vpc.fromLookup(this, 'DefaultVpc', { isDefault: true });

    
    const app = new elasticbeanstalk.CfnApplication(this, 'DocqApplication', {
      applicationName: 'docqai',
      description: 'docqai application',
      
    });

    const appVersionProps = new elasticbeanstalk.CfnApplicationVersion(this, 'AppVersion', {
      applicationName: app.applicationName!.toString(),
      sourceBundle: {
        s3Bucket: 'docqai',
        s3Key: 'docqai.zip',
      },
  });


    // Create an Elastic Beanstalk environment.
    const environment = new elasticbeanstalk.CfnEnvironment(this, 'ElasticBeanstalkEnvironment', {
      //solutionStackName: '64bit Amazon Linux 2 v3.4.1 running Docker 19.03.13',
      solutionStackName: "64bit Amazon Linux 2 v3.5.7 running Docker", // @see https://docs.aws.amazon.com/elasticbeanstalk/latest/platforms/platforms-supported.html#platforms-supported.docker
      //platformVersion: '3.4.1',
      environmentName: 'docqai-dev',
      tier: environmentTier.WebServer,

      //instanceType: 't3.small',
      applicationName: app.applicationName!.toString(),
      
  }
  );
}
}


// aws ecr-public get-login-password --region us-east-1 --profile <your fabr profile name here> | docker login --username AWS --password-stdin public.ecr.aws/q0o2r1k7
// docker tag docqai/docq-rs:latest public.ecr.aws/q0o2r1k7/docqai/docq-rs:latest
// docker push public.ecr.aws/q0o2r1k7/docqai/docq-rs:latest
