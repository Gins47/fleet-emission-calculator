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
    });

    // create vehicle Data Lambda

    const createVehicleDataFunction = new lambda.Function(
      this,
      `createVehicleDataFunction`,
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "createVehicleLambda.lambdaHandler",
        code: lambda.Code.fromAsset("lib/resources/lambdas/src/handlers"),
        environment: {
          TABLE_NAME: table.tableName,
        },
      }
    );

    table.grantReadWriteData(createVehicleDataFunction);

    // Define API
    const vehicle = api.root.addResource("vehicle");
    vehicle.addMethod("POST", new LambdaIntegration(createVehicleDataFunction));
  }
}
