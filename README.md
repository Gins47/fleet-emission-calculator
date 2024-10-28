# Fleet Emission Calculator

### Setup

- Start localstack

```bask
localstack start
```

- Deploy to localstack

```bash
npm run cdk:local bootstrap
npm run cdk:local deploy
```

### Best Practices

Standardize pk and sk formats: Using a consistent format for pk and sk allows for better organization and more predictable queries. For example, you could use:

- pk = "user#<userId>", sk = "vehicle#<vehicleId>"
- pk = "vehicle#<vehicleId>", sk = "type#<vehicleType>"
- pk = "company#<companyId>", sk = "info"
  Use indexes for more access patterns: Add Global Secondary Indexes (GSIs) if you need to query based on attributes other than pk and sk. For instance:

A GSI with pk = "user#<userId>" and sk = "creationTime" would allow for user-based date range queries.
Another GSI could be set with pk = "vehicle#<vehicleId>" and sk = "fuelType" for filtering by vehicle and fuel type.
Leverage filters judiciously: Use DynamoDB filter expressions for attributes that aren’t keys, like fuelType, liters, or cost. But remember, filters process data after retrieval, so indexes are preferred if there are many items to filter out.

### AWS CLI Commands

Below are the some of the useful AWS CLI commands to work with your localStack infrastructure

```bash
# Deployment

export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_PROFILE=localstack

sam build
sam deploy --guided --region us-east-1 --profile localstack



# CloudFormation


aws cloudformation list-stacks --region us-east-1 --endpoint-url=http://localhost:4566

aws cloudformation delete-stack --stack-name telemetry-services --region us-east-1 --endpoint-url=http://localhost:4566

aws cloudformation delete-stack --stack-name aws-sam-cli-managed-default --region us-east-1 --endpoint-url=http://localhost:4566

aws cloudformation list-stacks --stack-status-filter DELETE_COMPLETE --region us-east-1 --endpoint-url=http://localhost:4566

aws cloudformation describe-stacks --stack-name telemetry-service --endpoint-url=http://localhost:4566  --region us-east-1

aws cloudformation describe-stack-resources --stack-name telemetry-services --endpoint-url=http://localhost:4566 --region us-east-1



# API Gateway

aws apigateway get-rest-apis --endpoint-url=http://localhost:4566 --region us-east-1

aws apigateway delete-stage --rest-api-id szt80q7wda --stage-name DevStage --endpoint-url=http://localhost:4566 --region us-east-1

aws apigateway delete-rest-api  --rest-api-id szt80q7wda  --endpoint-url=http://localhost:4566 --region us-east-1

aws apigateway get-api-keys --include-values --region us-east-1 --endpoint-url=http://localhost:4566

aws apigateway get-resources --rest-api-id egpnkrrsgi --region us-east-1 --endpoint-url=http://localhost:4566



# Lambda

aws lambda list-functions --endpoint-url=http://localhost:4566 --region us-east-1

aws lambda invoke --function-name telemetry-services-ConsumeMsgFromSQSFunctio-cd77284c output.txt --profile localstack --endpoint-url=http://localhost:4566

aws lambda list-event-source-mappings --endpoint-url=http://localhost:4566 --region us-east-1

aws lambda list-functions --endpoint-url=http://localhost:4566 --region us-east-1



# dynamodb

aws dynamodb list-tables --endpoint-url=http://localhost:4566 --region us-east-1

aws dynamodb scan --table-name TelemetryDataStore --endpoint-url=http://localhost:4566 --region us-east-1

aws dynamodb describe-table --table-name TelemetryDataStore --endpoint-url=http://localhost:4566 --region us-east-1

aws dynamodb put-item --table-name TelemetryDataStore --item '{"siteId": {"S": "site123"},"deviceId": {"S": "qwert123"},"creationTime": {"N": "1729102441"} }' --endpoint-url=http://localhost:4566 --region us-east-1


# CloudWatch



aws logs describe-log-groups --endpoint-url=http://localhost:4566 --region us-east-1

aws logs delete-log-group --log-group-name /aws/lambda/telemetry-services-ConsumeMsgFromSQSFunctio-53d2678c --endpoint-url=http://localhost:4566 --region us-east-1

aws logs describe-log-streams --log-group-name /aws/lambda/telemetry-services-ConsumeMsgFromSQSFunctio-53d2678c --endpoint-url=http://localhost:4566 --region us-east-1

aws logs get-log-events --log-group-name /aws/lambda/telemetry-services-ConsumeMsgFromSQSFunctio-53d2678c  --log-stream-name '2024/10/13/[$LATEST]e517368f626dee6019727353f78d6e0c' --endpoint-url=http://localhost:4566 --region us-east-1


# SQS


aws sqs list-queues --endpoint-url=http://localhost:4566 --region eu-central-1

aws sqs receive-message --queue-url=http://localhost:4566/000000000000/MyQueue --endpoint-url=http://localhost:4566  --region us-east-1

aws sqs receive-message --queue-url=http://localhost:4566/000000000000/TelemetryQueue --endpoint-url=http://localhost:4566  --region us-east-1

```
