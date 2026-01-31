export interface Employee {
  // Optional MongoDB generated identifier
  _id?: string;

  // Basic employee fields – adjust as needed
  name: string;
  position?: string;
  department?: string;
  salary?: number;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}