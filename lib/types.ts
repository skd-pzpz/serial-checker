export type SerialStatus = "active" | "inactive";

export interface SerialRecord {
  id: number;
  serialNumber: string;
  holderName: string;
  status: SerialStatus;
  activatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SerialQuerySuccess {
  exists: true;
  data: SerialRecord;
}

export interface SerialQueryFailure {
  exists: false;
  message: string;
}

export type SerialQueryResponse = SerialQuerySuccess | SerialQueryFailure;
