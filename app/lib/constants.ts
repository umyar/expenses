import { VendorT } from '@/app/types';

export const categoriesDictionary: Record<string, string> = {
  groceries: 'Groceries',
  'personal-care': 'Personal Care',
  'restaurants-delivery': 'Restaurants & Delivery',
  transportation: 'Transportation',
  utilities: 'Utilities',
  'clothes-shoes': 'Clothes & Shoes',
  other: 'Other',
};

export const vendorNames: Record<VendorT, string> = {
  '1': 'Continente',
  '2': 'Pingo Doce',
};
