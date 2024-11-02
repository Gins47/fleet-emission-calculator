import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";

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

    // create vehicle Data Lambda

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

    // get vehicle Data Lambda

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
