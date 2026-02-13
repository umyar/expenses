import * as React from 'react';

import { VendorT } from '@/app/types';
import { vendorNames } from '@/app/lib/constants';

const classNames = {
  '1': 'inline-flex items-center px-2 py-0.5 text-sm rounded-full border border-red-400 text-foreground',
  '2': 'inline-flex items-center px-2 py-0.5 text-sm rounded-full border border-green-600 text-foreground',
  '3': 'inline-flex items-center px-2 py-0.5 text-sm rounded-full border border-cyan-500 text-foreground',
};

interface IVendorBadgeProps {
  vendor: VendorT | null;
}

export const VendorBadge = ({ vendor }: IVendorBadgeProps) => {
  const name = vendor ? vendorNames[vendor] : 'N/A';
  const cns = vendor ? classNames[vendor] : '';

  return <span className={cns}>{name}</span>;
};
