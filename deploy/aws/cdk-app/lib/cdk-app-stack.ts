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


export const ebEnvionmentOptionsValueMap = {

  awsAutoscalingLaunchconfiguration: {
    Namespace: "aws:autoscaling:launchconfiguration",
    OptionNames: { IamInstanceProfile: "IamInstanceProfile" },
  },

  awsEc2Instances: {
    Namespace: "aws:ec2:instances",
    OptionNames: {
      InstanceTypes: {
        t3Medium: "t3.medium",
      }
    },
  },

  awsElasticbeanstalkEnvironment: {
    Namespace: "aws:elasticbeanstalk:environment",
    OptionNames: {
      EnvironmentType: { LoadBalanced: "LoadBalanced", SingleInstance: "SingleInstance" },
      /**
       * IAM role name, path/name, or ARN
       */
      ServiceRole: "",
      LoadBalancerType: {
        Application: "application",
        Classic: "classic",
        Network: "network",
      },
      LoadBalancerIsShared: {
        true: "true",
        false: "false",
      },
    }
  }
}



export type OptionSetting = { namespace: string, optionName: string, value: string };

export type TierType = "Standard" | "SQS/HTTP";
export type TierName = "WebServer" | "Worker";
export type EnvironmentTier = { name: TierName, type: TierType }

export enum EnvironmentType {
  LoadBalanced = "LoadBalanced",
  SingleInstance = "SingleInstance",
}

export enum ProxyServer {
  Nginx = "nginx",
  /**
   * Amazon Linux AM and Docker w/DC only
   */
  None = "none",
}

const webServerTier: EnvironmentTier = { name: "WebServer", type: "Standard" };


const workerTier: EnvironmentTier = { name: "Worker", type: "SQS/HTTP" };

export const environmentTiers = {
  WebServer: webServerTier,
  /**
   * @see https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features-managing-env-tiers.html
   */
  Worker: workerTier,
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


    const thisAccuntId = cdk.Stack.of(this).account;
    const thisRegion = cdk.Stack.of(this).region;

    const ebS3BucketName = `elasticbeanstalk-${thisRegion}-${thisAccuntId}`;
    const ebS3Bucket = s3.Bucket.fromBucketName(this, 'ebS3Bucket', ebS3BucketName);


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

    const frontendApp = new elasticbeanstalk.CfnApplication(this, 'DocqApplication', {
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


    const appVersionLabel = `${appName}-v1.0.0`;
    const frontendAppVersion = new elasticbeanstalk.CfnApplicationVersion(this, 'AppVersionFrontend', {
      applicationName: frontendApp.ref,
      sourceBundle: {
        s3Bucket: asset.bucket.bucketName,
        //s3Key: `apps/${appName}/Dockerrun.aws.json`,
        s3Key: `${asset.s3ObjectKey}`,
      },

    });

    frontendAppVersion.addDependency(frontendApp);
    frontendAppVersion.node.addDependency(asset);



    // Create an Elastic Beanstalk environment.
    const webAppEnv = new elasticbeanstalk.CfnEnvironment(this, "EbEnvironmentDocqaiFrontend", {
      //solutionStackName: '64bit Amazon Linux 2 v3.4.1 running Docker 19.03.13',
      solutionStackName: "64bit Amazon Linux 2 v3.5.7 running Docker", // @see https://docs.aws.amazon.com/elasticbeanstalk/latest/platforms/platforms-supported.html#platforms-supported.docker
      //platformVersion: '3.4.1',
      environmentName: paramEnvironmentName.valueAsString,
      description: "Environment for the Docq AI frontend application",
      tier: environmentTiers.WebServer,


      //instanceType: 't3.small',
      applicationName: appName,
      versionLabel: frontendAppVersion.ref, // specify the version of the application that you want to deploy
      optionSettings: [ // @see https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/command-options-general.html
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
          value: props!.ebEnvProps?.ec2InstanceTypes ? `${props!.ebEnvProps?.ec2InstanceTypes},t3.medium` : 't3.medium',
        },
        {
          namespace: 'aws:elasticbeanstalk:environment',
          optionName: 'EnvironmentType',
          value: EnvironmentType.SingleInstance,
        },
        {
          namespace: 'aws:elasticbeanstalk:environment:proxy',
          optionName: 'ProxyServer',
          value: ProxyServer.Nginx,
        },
        {
          namespace: 'aws:elasticbeanstalk:application',
          optionName: 'Application Healthcheck URL',
          value: "/", // valid value ex: `/` (HTTP GET to root path),  `/health`, `HTTPS:443/`, `HTTPS:443/health`
        },
        {
          namespace: 'aws:elasticbeanstalk:application:environment',
          optionName: 'RANDOM_VAR',
          value: 'hello env var',
        },
        {
          namespace: 'aws:elasticbeanstalk:application:environment',
          optionName: 'RANDOM_VAR2',
          value: 'hello env var 2',
        },

      ],
    });

    webAppEnv.addDependency(frontendAppVersion);

    new cdk.CfnOutput(this, 'AppEnvEndpoint', {
      value: `http://${webAppEnv.attrEndpointUrl}`,
    });


    new cdk.CfnOutput(this, 'AppEnvCName', {
      value: `http://${webAppEnv.cnamePrefix}`,
    });

    new cdk.CfnOutput(this, 'AppName', {
      value: frontendApp.applicationName!.toString(),
    });


    const appName2 = `ml-model-huggingface-app`;

    const huggingfaceAsset = new assets.Asset(this, 'huggingfaceDockerRunAwsJsonZip', { // uploads into a CDK assets bucket
      path: path.join(__dirname, "dockerrun-huggingface"),

    });

    const mlModelHuggingfaceApp = new elasticbeanstalk.CfnApplication(this, 'MlModelHuggingfaceApplication', {
      applicationName: appName2,
      description: 'Huggingface ML Model using the HazyResearch Manifest wrapper',
    });

    const mlModelHuggingfaceAppVersion = new elasticbeanstalk.CfnApplicationVersion(this, 'MlModelHuggingfaceApplicationVersion', {
      applicationName: mlModelHuggingfaceApp.ref,
      sourceBundle: {
        s3Bucket: huggingfaceAsset.bucket.bucketName,
        //s3Key: `apps/${appName}/Dockerrun.aws.json`,
        s3Key: `${huggingfaceAsset.s3ObjectKey}`,
      },

    });

    mlModelHuggingfaceAppVersion.addDependency(mlModelHuggingfaceApp);
    frontendAppVersion.node.addDependency(huggingfaceAsset);

    const huggingfaceAppEnv = new elasticbeanstalk.CfnEnvironment(this, "EbEnvironmentHuggingface", {
      //solutionStackName: '64bit Amazon Linux 2 v3.4.1 running Docker 19.03.13',
      solutionStackName: "64bit Amazon Linux 2 v3.5.7 running Docker", // @see https://docs.aws.amazon.com/elasticbeanstalk/latest/platforms/platforms-supported.html#platforms-supported.docker
      //platformVersion: '3.4.1',
      environmentName: "ml-model-huggingface-env",
      description: "Huggingface ML Model using the HazyResearch Manifest wrapper",
      tier: environmentTiers.WebServer,


      //instanceType: 't3.small',
      applicationName: appName2,
      versionLabel: mlModelHuggingfaceAppVersion.ref, // specify the version of the application that you want to deploy
      optionSettings: [ // @see https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/command-options-general.html
        {
          namespace: 'aws:autoscaling:launchconfiguration',
          optionName: 'IamInstanceProfile',
          value: instanceProfile.instanceProfileName,
        },
        {
          namespace: 'aws:autoscaling:launchconfiguration',
          optionName: 'RootVolumeSize',
          value: '250', // in GB. with what ever the default is for t3.2xLarge, Docker pull in fails with disk space error
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
          value: `t3.2xlarge`,
        },
        {
          namespace: 'aws:elasticbeanstalk:environment',
          optionName: 'EnvironmentType',
          value: EnvironmentType.SingleInstance,
        },
        {
          namespace: 'aws:elasticbeanstalk:environment:proxy',
          optionName: 'ProxyServer',
          value: ProxyServer.Nginx,
        },
        {
          namespace: 'aws:elasticbeanstalk:application',
          optionName: 'Application Healthcheck URL',
          value: "/", // valid value ex: `/` (HTTP GET to root path),  `/health`, `HTTPS:443/`, `HTTPS:443/health`
        },
        {
          namespace: 'aws:elasticbeanstalk:application:environment',
          optionName: 'RANDOM_VAR',
          value: 'hello env var',
        },
        {
          namespace: 'aws:elasticbeanstalk:application:environment',
          optionName: 'FLASK_PORT',
          value: '80',
        },
        {
          namespace: 'aws:elasticbeanstalk:healthreporting:system',
          optionName: 'SystemType',
          value: 'enhanced',
        },
        {
          namespace: 'aws:elasticbeanstalk:cloudwatch:logs',
          optionName: 'StreamLogs',
          value: 'true',
        },
        {
          namespace: 'aws:elasticbeanstalk:cloudwatch:logs',
          optionName: 'DeleteOnTerminate',
          value: 'true',
        },
        {
          namespace: 'aws:elasticbeanstalk:cloudwatch:logs',
          optionName: 'RetentionInDays',
          value: '1',
        },
      ],
    });

    new cdk.CfnOutput(this, 'huggingfaceAppEnvEndpoint', {
      value: `http://${huggingfaceAppEnv.attrEndpointUrl}`,
    });


    new cdk.CfnOutput(this, 'huggingfaceAppEnvCName', {
      value: `http://${huggingfaceAppEnv.cnamePrefix}`,
    });

    new cdk.CfnOutput(this, 'huggingfaceAppEnvName', {
      value: huggingfaceAppEnv.applicationName!.toString(),
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
