import { APIGatewayProxyEvent } from "aws-lambda";
import { publishToSQS } from "../controllers/fleet-emission.controller";

export const handler = async (event: APIGatewayProxyEvent) => {
  return await publishToSQS(event);
};
