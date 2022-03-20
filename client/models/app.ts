export interface UserDetails {
  userName: string;
  address?: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  birthdate?: string;
  firstName?: string;
  gender?: 'F' | 'M';
  lastName?: string;
  phoneNumber?: string;
}