import { FleetEmissionData } from "../models/fleet-emission.model";
import { FleetEmissionRepository } from "../repository/fleet-emission.repository";
import { SQS } from "aws-sdk";
export class FleetEmissionService {
  private fleetEmissionRepository;
  private sqs: SQS;
  private QUEUE_URL: string;
  constructor() {
    this.fleetEmissionRepository = new FleetEmissionRepository();
    this.sqs = new SQS({ endpoint: "http://localhost:4566" });
    this.QUEUE_URL = process.env.QUEUE_URL!;
  }

  /**
   *
   * @param input
   */
  async createVehicleEmissionData(input: FleetEmissionData) {
    await this.fleetEmissionRepository.createVehicleEmissionData(input);
  }
  /**
   *
   * @param vehicleNumber
   * @param creationTime
   * @returns
   */

  async getVehicleEmissionData(vehicleNumber: string, creationTime: number) {
    return await this.fleetEmissionRepository.getVehicleEmissionData(
      vehicleNumber,
      creationTime
    );
  }

  /**
   *
   * @param data
   */

  async publishFleetEmissionDataToSQS(data: FleetEmissionData) {
    const params = {
      QueueUrl: this.QUEUE_URL,
      MessageBody: JSON.stringify(data),
    };
    try {
      console.log(`SQS event data: `, JSON.stringify(params));
      await this.sqs.sendMessage(params).promise();
    } catch (error) {
      console.error(`Error: publishFleetEmissionDataToSQS = ${error}`);
      throw error;
    }
  }
}
