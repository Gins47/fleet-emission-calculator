import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { FleetEmissionService } from "../services/fleet-emission.service";

/**
 *
 * @param event
 * @returns
 */
export const createVehicleDataController = async (
  event: APIGatewayProxyEvent
) => {
  const fleetEmissionService = new FleetEmissionService();

  try {
    const body = JSON.parse(event.body!);

    await fleetEmissionService.createVehicleEmissionData(body);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Vehicle data saved successfully" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error occurred when saving vehicle data",
      }),
    };
  }
};

/**
 *
 * @param event
 */
export const getVehicleDataByCreationTimeController = async (
  event: APIGatewayProxyEvent
) => {
  try {
    const fleetEmissionService = new FleetEmissionService();
    const vehicleNumber = event.pathParameters?.vehicleNumber;
    const creationTime = event.pathParameters?.creationTime;
    if (vehicleNumber && creationTime) {
      const data = await fleetEmissionService.getVehicleEmissionData(
        vehicleNumber,
        parseInt(creationTime)
      );

      return {
        statusCode: 200,
        body: JSON.stringify(data),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error occurred when getting vehicle data",
      }),
    };
  }
};
