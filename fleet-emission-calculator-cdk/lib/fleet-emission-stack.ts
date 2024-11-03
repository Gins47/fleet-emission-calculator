import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";

export class FleetEmissionStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // API gateway

    const api = new RestApi(this, "ApiGateway", {
      restApiName: "Fleet Emission API",
      deployOptions: {
        stageName: "dev",
      },
    });

    // Fleet emission Queue
    const queue = new sqs.Queue(this, "FleetEmissionQueue", {
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    // Dynamodb table
    const table = new dynamodb.Table(this, "FleetEmissionDataTable", {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: "FleetEmissionData",
    });

    // GSI : Vehicle company and Vehicle Type
    table.addGlobalSecondaryIndex({
      indexName: "VehicleCompanyTypeIndex",
      partitionKey: {
        name: "vehicleCompany",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: "vehicleType", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Create vehicle Data Lambda

    const createVehicleDataFunction = new lambda.Function(
      this,
      `createVehicleDataFunction`,
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 128,
        timeout: cdk.Duration.seconds(100),
        architecture: lambda.Architecture.X86_64,
        handler: "createVehicleLambda.handler",
        code: lambda.Code.fromAsset("dist/handlers"),
        environment: {
          DYNAMODB_TABLE: table.tableName,
        },
      }
    );
    table.grantReadWriteData(createVehicleDataFunction);
    const vehicle = api.root.addResource("vehicle");
    vehicle.addMethod("POST", new LambdaIntegration(createVehicleDataFunction));

    // Publish vehicle Data Lambda

    const publishVehicleDataFunction = new lambda.Function(
      this,
      `publishVehicleDataFunction`,
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 128,
        timeout: cdk.Duration.seconds(100),
        architecture: lambda.Architecture.X86_64,
        handler: "publishEmissionData.handler",
        code: lambda.Code.fromAsset("dist/handlers"),
        environment: {
          QUEUE_URL: queue.queueUrl,
        },
      }
    );
    queue.grantSendMessages(publishVehicleDataFunction);

    const publishResource = vehicle.addResource("publish");
    publishResource.addMethod(
      "POST",
      new LambdaIntegration(publishVehicleDataFunction)
    );

    // Consume fleet emission data

    const sqsConsumerFunction = new lambda.Function(
      this,
      "sqsConsumerFunction",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "consumeEmissionData.handler",
        code: lambda.Code.fromAsset("dist/handlers"),
        environment: {
          DYNAMODB_TABLE: table.tableName,
          QUEUE_URL: queue.queueUrl,
        },
      }
    );
    table.grantWriteData(sqsConsumerFunction);
    sqsConsumerFunction.addEventSource(
      new lambdaEventSources.SqsEventSource(queue, {})
    );

    // Get vehicle Data Lambda

    const getVehicleDataFunction = new lambda.Function(
      this,
      `getVehicleDataFunction`,
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 128,
        timeout: cdk.Duration.seconds(100),
        architecture: lambda.Architecture.X86_64,
        handler: "getVehicleDataLambda.handler",
        code: lambda.Code.fromAsset("dist/handlers"),
        environment: {
          DYNAMODB_TABLE: table.tableName,
        },
      }
    );

    table.grantReadData(getVehicleDataFunction);

    const vehicleNumberResource = vehicle.addResource("{vehicleNumber}");
    const timeResource = vehicleNumberResource.addResource("time");
    const creationTimeResource = timeResource.addResource("{creationTime}");
    creationTimeResource.addMethod(
      "GET",
      new LambdaIntegration(getVehicleDataFunction),
      {
        requestParameters: {
          "method.request.path.vehicleNumber": true,
          "method.request.path.creationTime": true,
        },
      }
    );
  }
}
