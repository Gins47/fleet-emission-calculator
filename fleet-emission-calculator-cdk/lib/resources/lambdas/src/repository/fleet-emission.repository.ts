import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { FleetEmissionData } from "../models/fleet-emission.model";
import { AppError } from "../errors/AppError";

export class FleetEmissionRepository {
  private dynamodb: DocumentClient;
  private tableName: string;

  constructor() {
    this.dynamodb = new DocumentClient({
      endpoint:
        process.env.DYNAMODB_ENDPOINT || "http://host.docker.internal:4566",
    });
    this.tableName = process.env.DYNAMODB_TABLE || "FleetEmissionDataStore";
  }

  /**
   *
   * @param input
   */
  async createVehicleEmissionData(input: FleetEmissionData) {
    try {
      const data = {
        ...input,
        pk: `vehicle#${input.vehicleNumber}`,
        sk: `creationTime#${input.creationTime}`,
      };
      const params = {
        TableName: this.tableName,
        Item: data,
      };
      console.log(
        `createVehicleEmissionData == params = ${JSON.stringify(params)}`
      );
      await this.dynamodb.put(params).promise();
    } catch (error) {
      console.error(
        `Error:FleetEmissionRepository:createVehicleEmissionData = ${error}`
      );

      throw new AppError(
        `Error occurred while saving vehicle emission data in DynamoDB`,
        500
      );
    }
  }

  /**
   *
   * @param vehicleNumber
   * @param creationTime
   */

  async getVehicleEmissionData(vehicleNumber: string, creationTime: number) {
    try {
      const params = {
        TableName: this.tableName,
        Key: {
          pk: `vehicle#${vehicleNumber}`,
          sk: `creationTime#${creationTime}`,
        },
      };

      console.log(
        `getVehicleEmissionData == params = ${JSON.stringify(params)}`
      );
      const result = await this.dynamodb.get(params).promise();

      console.log(
        `getVehicleEmissionData ==  Data result= ${JSON.stringify(result)}`
      );
      return result;
    } catch (error) {
      console.error(
        `Error:FleetEmissionRepository:getVehicleEmissionData = ${error}`
      );

      throw new AppError(
        `Error occurred while getting vehicle emission data in DynamoDB`,
        500
      );
    }
  }
}
