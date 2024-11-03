import { SQSEvent } from "aws-lambda";
import { FleetEmissionService } from "../services/fleet-emission.service";

export class SQSListenerController {
  private fleetEmissionService: FleetEmissionService;

  constructor() {
    this.fleetEmissionService = new FleetEmissionService();
  }

  public async handle(event: SQSEvent): Promise<void> {
    try {
      console.log("SQS consumer started");

      // Process each SQS message
      for (const record of event.Records) {
        const message = JSON.parse(record.body);
        await this.fleetEmissionService.createVehicleEmissionData(message);
      }

      console.log("Successfully processed all messages");
    } catch (error) {
      console.error("Error processing SQS message:", error);
      throw error; // Re-throw to trigger Lambda retry
    }
  }
}
