export enum MachineStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
}

export interface Machine {
  id: string;
  name: string;
  ip: string;
  status: MachineStatus;
  ram: {
    total: number;
    used?: number;
    available?: number;
  };
  cpu: {
    cores: number;
    usage?: number;
  };
}


