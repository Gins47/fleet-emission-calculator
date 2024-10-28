import { APIGatewayProxyEvent } from "aws-lambda";
import { getVehicleDataByCreationTimeController } from "../controllers/fleet-emission.controller";

const lambdaHandler = async (event: APIGatewayProxyEvent) => {
  return await getVehicleDataByCreationTimeController(event);
};
