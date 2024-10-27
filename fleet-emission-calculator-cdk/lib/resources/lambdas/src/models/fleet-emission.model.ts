export interface FleetEmissionData {
  pk?: string; // partition key
  sk?: string; // sort key
  creationTime: number;
  creationTimeISO: string;
  userId: string;
  vehicleNumber: string;
  vehicleType: string;
  vehicleCompany: string;
  fuelType: string;
  liters: number;
  cost: number;
  co2EmissionFactor: number;
}
