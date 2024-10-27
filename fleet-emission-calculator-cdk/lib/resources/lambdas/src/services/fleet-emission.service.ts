import { FleetEmissionData } from "../models/fleet-emission.model";
import { FleetEmissionRepository } from "../repository/fleet-emission.repository";

export class FleetEmissionService {
  private fleetEmissionRepository;
  constructor() {
    this.fleetEmissionRepository = new FleetEmissionRepository();
  }

  async createVehicleEmissionData(input: FleetEmissionData) {
    await this.fleetEmissionRepository.createVehicleEmissionData(input);
  }

  async getVehicleEmissionData(vehicleNumber: string, creationTime: number) {
    await this.fleetEmissionRepository.getVehicleEmissionData(
      vehicleNumber,
      creationTime
    );
  }
}
