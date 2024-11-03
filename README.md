##Introduction

This project is a Fleet Emission Data Management System designed to track and manage emissions data for various vehicles within a fleet. Built using AWS infrastructure, the project leverages `AWS Lambda` for serverless compute, `DynamoDB` for highly scalable storage, and `Amazon SQS` for asynchronous message queuing. The application is developed with modular code and follows a well-defined structure to enhance reusability, maintainability, and scalability. By using `TypeScript`, we ensure strong type-checking, which helps maintain code quality and minimize runtime errors.

For local AWS development and testing we will be making use of **LocalStack**.

##Prerequisites

Make sure that you have the following installed in you local development setup.

1. NodeJS
2. Docker
3. AWS CLI
4. Localstack

For this project we will be using AWS CDK for the infrastructure setup and deployment.

###Install AWS CDK

```Bash
npm install -g aws-cdk
```

##Architecture Diagram

![High level architecture diagram](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/k2kqdbjx4vr0v1n4i9rh.png)

##DynamoDB Table Design

The DynamoDB table uses a standardized approach to defining the **partition key (pk)** and **sort key (sk)** to make it adaptable for multiple data entities. This structure allows us to store and retrieve different types of data (e.g., vehicle data, company data) while keeping the data organized and easily queryable.

**Partition Key (pk):** Uniquely identifies each entity type in the table.
**Sort Key (sk):** Provides the secondary key to allow range queries and ordering within each partition.

##### Primary Key Format

**Partition Key (pk):** Composed of the entity type and unique identifier, following the format `entityType#identifier`.
Example: For a vehicle emission entry, the pk could be `vehicle#M-MJ-456`.
**Sort Key (sk):** Used for time-series data or sub-entities within the same partition, following the format `attribute#value`.
Example: For vehicle data, the sk could be `creationTime#1730641488`.
This structure allows the table to support multiple entities (such as vehicles and companies) by defining each type with a specific prefix, while also allowing range queries on creationTime.

## Project Setup

###Project Structure

I followed clean architecture principles, with separate folders for handlers, controllers, models, repositories, services, and error handling. Below is a breakdown of each main folder and its purpose:

- `lib/resources/lambdas/src:` This is the main source folder for the Lambda functions and supporting files. It includes subdirectories for controllers, handlers, models, repositories, services, and error handling.

**Folders**

- `controllers`: Contains controllers responsible for handling incoming requests and directing them to the appropriate services.
- `services`: Includes general application services that provide reusable business logic across various controllers and handlers.
- `repository`: This folder contains classes and methods for interacting with DynamoDB.
- `models`: Defines TypeScript models or interfaces used throughout the application.
- `errors`: This folder manages custom error classes for the application.
- `handlers`: Contains the AWS Lambda handler functions, which serve as entry points for each Lambda function.
  - `consumeEmissionData.ts`: Consumes emission data from an SQS queue.
  - `createVehicleLambda.ts`: Handles vehicle data creation.
  - `getVehicleDataLambda.ts`: Retrieves vehicle data by vehicleNumber and CreationTime.
  - `publishEmissionData.ts`: Publishes emission data to an SQS queue.

###AWS CDK Stack
By using AWS CDK we can create the required resources very easily. Below, you can find the way to create various AWS resources using AWS CDK.

- API Gateway

```Bash
 const api = new RestApi(this, "ApiGateway", {
      restApiName: "Fleet Emission API",
      deployOptions: {
        stageName: "dev",
      },
    });
```

- SQS

```bash
   const queue = new sqs.Queue(this, "FleetEmissionQueue", {
      visibilityTimeout: cdk.Duration.seconds(300),
    });
```

- DynamoDB

```bash
 const table = new dynamodb.Table(this, "FleetEmissionDataTable", {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: "FleetEmissionData",
    });
```

In this set up, I am adding a **Global Secondary Index (GSI)** called `VehicleCompanyTypeIndex` with the following structure:

**Partition Key:** vehicleCompany (string) - Enables queries to be grouped by the company.
**Sort Key:** vehicleType (string) - Allows sorting and filtering by vehicle type within each company.
**Projection Type:** ALL - Includes all attributes from the original table in the index, making it possible to access the entire item data without referring back to the main table.

```bash
 table.addGlobalSecondaryIndex({
      indexName: "VehicleCompanyTypeIndex",
      partitionKey: {
        name: "vehicleCompany",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: { name: "vehicleType", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
```

- Create Vehicle Data Lambda function

```bash
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
```

We need to give access permission to the lambda funtion to write data to DynamoDB. This can be achieved using below command.

```bash
    table.grantReadWriteData(createVehicleDataFunction);
```

In order to integrate the API Gateway with our Lambda funtion we can create a new route in the API Gateway and trigger the Lambda funtion using below command.

```bash
    const vehicle = api.root.addResource("vehicle");
    vehicle.addMethod("POST", new LambdaIntegration(createVehicleDataFunction));
```

- Publish data to SQS

In order to publish data to SQS, I used a lambda function.

```bash
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
```

We also need to give permission for this lambda function to send message to SQS queue.

```bash
 queue.grantSendMessages(publishVehicleDataFunction);
```

Now lets link this lambda function to API Gateway.

```bash
    const publishResource = vehicle.addResource("publish");
    publishResource.addMethod(
      "POST",
      new LambdaIntegration(publishVehicleDataFunction)
    );
```

###Deployment to LocalStack

Lets start the localstack using the command below

```Bash
localstack start
```

After LocalStack is ready, lets bootstrap the cdk using below command.

```Bash
npm run cdk:local bootstrap
```

After successfully bootstrapping lets build project for deployment.

```Bash
npm run build
```

Now, Lets deploy the project to localStack using the command below.

```Bash
npm run cdk:local deploy
```

###API Endpoints

| Method | Endpoint                                       | Description                           |
| ------ | ---------------------------------------------- | ------------------------------------- |
| GET    | `/vehicle/{VehicleNumber}/time/{creationTime}` | Retrieve vehicle data by creationTime |
| POST   | `/vehicle`                                     | Create new vehicle Emission Data      |
| POST   | `/vehicle/sqs`                                 | Publish emission data to SQS          |

###API Test

- Create vehicle data

```bash
curl --location '{API Gateway Endpoint}/dev/vehicle' \
--header 'Content-Type: application/json' \
--data '{
    "creationTime": 1730641478,
    "creationTimeISO": "2024-11-03T13:44:38+00:00",
    "userId": "user12",
    "vehicleNumber": "M-GC-123",
    "vehicleType": "CAR",
    "vehicleCompany": "BMW",
    "fuelType": "Petrol",
    "liters": 5.7,
    "cost": 324,
    "co2EmissionFactor": 34
}'
```

- Get vehicle data by vehicle number and creation timestamp

```bash
curl --location '{API Gateway Endpoint}/dev/vehicle/M-GC-123/time/1730641478'
```

- Publish vehicle data to SQS queue

```bash
curl --location '{API Gateway Endpoint}/dev/vehicle/publish' \
--header 'Content-Type: application/json' \
--data '{
    "creationTime": 1730641488,
    "creationTimeISO": "2024-11-03T14:44:38+00:00",
    "userId": "user12",
    "vehicleNumber": "M-MJ-456",
    "vehicleType": "CAR",
    "vehicleCompany": "Benz",
    "fuelType": "Petrol",
    "liters": 9.7,
    "cost": 1234,
    "co2EmissionFactor": 50
}'
```

## AWS CLI Commands

Below are some of the useful AWS CLI commands.

```bash
# CloudFormation

aws cloudformation list-stacks --endpoint-url=http://localhost:4566  --region us-east-1

aws cloudformation delete-stack --stack-name FleetEmissionStack --region us-east-1 --endpoint-url=http://localhost:4566

aws cloudformation list-stacks --stack-status-filter DELETE_COMPLETE --region us-east-1 --endpoint-url=http://localhost:4566

aws cloudformation describe-stacks --stack-name FleetEmissionStack --endpoint-url=http://localhost:4566  --region us-east-1

aws cloudformation describe-stack-resources --stack-name FleetEmissionStack --endpoint-url=http://localhost:4566 --region us-east-1


# API Gateway

aws apigateway get-rest-apis --endpoint-url=http://localhost:4566 --region us-east-1

aws apigateway delete-stage --rest-api-id szt80q7wda --stage-name DevStage --endpoint-url=http://localhost:4566 --region us-east-1

aws apigateway delete-rest-api  --rest-api-id szt80q7wda  --endpoint-url=http://localhost:4566 --region us-east-1

aws apigateway get-api-keys --include-values --region us-east-1 --endpoint-url=http://localhost:4566

aws apigateway get-resources --rest-api-id egpnkrrsgi --region us-east-1 --endpoint-url=http://localhost:4566

# Lambda

aws lambda list-functions --endpoint-url=http://localhost:4566 --region us-east-1

aws lambda list-event-source-mappings --endpoint-url=http://localhost:4566 --region us-east-1

# dynamodb

aws dynamodb list-tables --endpoint-url=http://localhost:4566 --region us-east-1

aws dynamodb scan --table-name FleetEmissionData --endpoint-url=http://localhost:4566 --region us-east-1

aws dynamodb describe-table --table-name FleetEmissionData --endpoint-url=http://localhost:4566 --region us-east-1


# SQS

aws sqs list-queues --endpoint-url=http://localhost:4566 --region eu-central-1

aws sqs receive-message --queue-url=http://sqs.eu-central-1.localhost.localstack.cloud:4566/000000000000/FleetEmissionStack-FleetEmissionQueue2C4D14-9b6bdecd --endpoint-url=http://localhost:4566  --region us-east-1

```
