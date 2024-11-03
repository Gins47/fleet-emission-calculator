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
      console.log(
        `getVehicleDataByCreationTimeController: result == ${JSON.stringify(
          data
        )}`
      );
      return {
        statusCode: 200,
        body: JSON.stringify(data),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify(`Bad Request`),
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

/**
 *
 * @param event
 * @returns
 */
export const publishToSQS = async (event: APIGatewayProxyEvent) => {
  const fleetEmissionService = new FleetEmissionService();
  try {
    const body = JSON.parse(event.body!);
    await fleetEmissionService.publishFleetEmissionDataToSQS(body);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Fleet emission data published to queue successfully",
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error publishing emission data to queue",
      }),
    };
  }
};
