import { APIGatewayProxyEvent } from "aws-lambda";
import { getVehicleDataByCreationTimeController } from "../controllers/fleet-emission.controller";

export const handler = async (event: APIGatewayProxyEvent) => {
  return await getVehicleDataByCreationTimeController(event);
};
