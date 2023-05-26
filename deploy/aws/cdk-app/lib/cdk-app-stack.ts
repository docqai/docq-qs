import * as cdk from "aws-cdk-lib"; //cdk v2
import { Construct } from "constructs";
import path from "path";

import * as iam from 'aws-cdk-lib/aws-iam';
import * as elasticbeanstalk from 'aws-cdk-lib/aws-elasticbeanstalk';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as assets from 'aws-cdk-lib/aws-s3-assets';
//import * as ecr from '@aws-cdk/aws-ecr';
//import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
//import * as efs from '@aws-cdk/aws-efs';

export const environmentTier = {
  WebServer: { name: 'WebServer', type: 'Standard' },
  Worker: { name: 'Worker', type: 'SQS/HTTP' },
}

export interface EBEnvProps {
  // Autoscaling group configuration
  autoscaleMinSize?: number;
  autoscaleMaxSize?: number;
  ec2InstanceTypes?: string;
  envName?: string;
}

export interface DocqStackProps extends cdk.StackProps {
  appName: string;
  /**
   * folder name with a Dockerrun.aws.json v1 file. Relative to the 'lib' folder. This folder can only contain this single file.
   */
  containerConfigFolder?: string;
  /**
   * The environment properties for the Elastic Beanstalk environment.
   */
  ebEnvProps?: EBEnvProps;
}


export class DocqStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: DocqStackProps) {
    super(scope, id, props);

    const paramAppName = new cdk.CfnParameter(this, 'paramAppName', {
      type: 'String',
      description: 'The name of the application in Elastic Beanstalk',
      default: props!.appName,
    });
    
    const paramEnvironmentName = new cdk.CfnParameter(this, 'environmentName', {
      type: 'String',
      description: 'The name of the environment in Elastic Beanstalk',
      default: props?.ebEnvProps?.envName,
    });

    
    
    const appName = paramAppName.valueAsString;

    const app = new elasticbeanstalk.CfnApplication(this, 'DocqApplication', {
      applicationName: appName,
      description: 'docqai application',
    });


    const resourceNamePrefix = `${props?.appName}-${generateRandomAlphanumericString(6)}`;

    const role = new iam.Role(this, `${resourceNamePrefix}-aws-elasticbeanstalk-ec2-role`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    const managedPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName('AWSElasticBeanstalkWebTier')
    role.addManagedPolicy(managedPolicy);

    const profileName = `${resourceNamePrefix}-InstanceProfile`

    const instanceProfile = new iam.CfnInstanceProfile(this, profileName, {
      instanceProfileName: profileName,
      roles: [
        role.roleName
      ]
    });

    // const bucket = new s3.Bucket(this, 'MyBucket', {
    //   bucketName: `${appName}-eb-deployments`,
    //   blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    //   encryption: s3.BucketEncryption.S3_MANAGED,
    //   enforceSSL: true,
    //   versioned: true,
    //   removalPolicy: cdk.RemovalPolicy.RETAIN,

    // });


    const asset = new assets.Asset(this, 'DockerRunAwsJsonZip', { // uploads into a CDK assets bucket
      path: path.join(__dirname, props?.containerConfigFolder || "dockerrun"),
    });

    const appVersion = new elasticbeanstalk.CfnApplicationVersion(this, 'AppVersion', {
      applicationName: appName,
      sourceBundle: {
        s3Bucket: asset.bucket.bucketName,
        //s3Key: `apps/${appName}/Dockerrun.aws.json`,
        s3Key: `${asset.s3ObjectKey}`,
      },
    });

    appVersion.addDependency(app);
    appVersion.node.addDependency(asset);


    // Create an Elastic Beanstalk environment.
    const environment = new elasticbeanstalk.CfnEnvironment(this, 'ElasticBeanstalkEnvironment', {
      //solutionStackName: '64bit Amazon Linux 2 v3.4.1 running Docker 19.03.13',
      solutionStackName: "64bit Amazon Linux 2 v3.5.7 running Docker", // @see https://docs.aws.amazon.com/elasticbeanstalk/latest/platforms/platforms-supported.html#platforms-supported.docker
      //platformVersion: '3.4.1',
      environmentName: paramEnvironmentName.valueAsString,
      tier: environmentTier.WebServer,

      //instanceType: 't3.small',
      applicationName: appName,
      versionLabel: appVersion.ref,
      optionSettings: [
        {
          namespace: 'aws:autoscaling:launchconfiguration',
          optionName: 'IamInstanceProfile',
          value: instanceProfile.instanceProfileName,
        },
        {
          namespace: 'aws:autoscaling:asg',
          optionName: 'MinSize',
          value: props!.ebEnvProps?.autoscaleMinSize?.toString() ?? '1',
        },
        {
          namespace: 'aws:autoscaling:asg',
          optionName: 'MaxSize',
          value: props!.ebEnvProps?.autoscaleMaxSize?.toString() ?? "1",
        },
        {
          namespace: 'aws:ec2:instances',
          optionName: 'InstanceTypes',
          value: props!.ebEnvProps?.ec2InstanceTypes ?? "t3.medium",
        },
      ],
    });

    //environment.addDependency(app);

    new cdk.CfnOutput(this, 'AppUrlHttp', {
      value: `http://${environment.attrEndpointUrl}`,
    });

    new cdk.CfnOutput(this, 'AppUrlHttps', {
      value: `https://${environment.attrEndpointUrl}`,
    });

  }
}

function generateRandomAlphanumericString(length: number) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}


// aws ecr-public get-login-password --region us-east-1 --profile <your fabr profile name here> | docker login --username AWS --password-stdin public.ecr.aws/q0o2r1k7
// docker tag docqai/docq-rs:latest public.ecr.aws/q0o2r1k7/docqai/docq-rs:latest
// docker push public.ecr.aws/q0o2r1k7/docqai/docq-rs:latest
