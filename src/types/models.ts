export interface BaseModel {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface StatusModel {
  status: string;
  status_display: string;
}

export interface TimestampModel {
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface UserReference {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface AddressModel {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}