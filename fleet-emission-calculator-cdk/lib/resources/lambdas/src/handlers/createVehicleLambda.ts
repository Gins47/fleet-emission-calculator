import { APIGatewayProxyEvent } from "aws-lambda";
import { createVehicleDataController } from "../controllers/fleet-emission.controller";

export const handler = async (event: APIGatewayProxyEvent) => {
  return await createVehicleDataController(event);
};
