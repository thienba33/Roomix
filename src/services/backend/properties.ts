import { api, emit, post } from './http';
import { readSession } from './session';

export interface Floor {
  id: string;
  houseId: string;
  floorNumber: number;
  name: string;
  description: string | null;
}

export interface House {
  id: string;
  name: string;
  addressStreet: string;
  ward: string;
  district: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  totalFloors: number;
  createdAt: string;
  updatedAt: string;
  floors: Floor[];
}

export type HouseInput = Pick<House, 'name' | 'addressStreet' | 'ward' | 'district' | 'city' | 'latitude' | 'longitude' | 'description' | 'totalFloors'>;
export type FloorInput = Pick<Floor, 'name' | 'floorNumber' | 'description'>;
export const PROPERTIES_EVENT = 'roomix:properties';

export async function listProperties(): Promise<House[]> {
  if (readSession()?.user.role !== 'LANDLORD') return [];
  const houses = await api<House[]>('/api/landlords/houses');
  return Promise.all(houses.map((house) => api<House>(`/api/landlords/houses/${house.id}`)));
}

async function changed<T>(request: Promise<T>): Promise<T> {
  const result = await request;
  emit(PROPERTIES_EVENT);
  return result;
}

export const createHouse = (input: HouseInput) => changed(post<House>('/api/landlords/houses', input));
export const updateHouse = (id: string, input: HouseInput) => changed(api<House>(`/api/landlords/houses/${id}`, { method: 'PUT', body: JSON.stringify(input) }));
export const deleteHouse = (id: string) => changed(api<void>(`/api/landlords/houses/${id}`, { method: 'DELETE' }));
export const createFloor = (houseId: string, input: FloorInput) => changed(post<Floor>(`/api/landlords/houses/${houseId}/floors`, input));
export const updateFloor = (houseId: string, id: string, input: FloorInput) => changed(api<Floor>(`/api/landlords/houses/${houseId}/floors/${id}`, { method: 'PUT', body: JSON.stringify(input) }));
export const deleteFloor = (houseId: string, id: string) => changed(api<void>(`/api/landlords/houses/${houseId}/floors/${id}`, { method: 'DELETE' }));
