'use client';

import { useEffect } from 'react';
import setupAxiosDefaults from '@/lib/axios-config';

export default function AxiosSetup() {
  useEffect(() => {
    setupAxiosDefaults();
  }, []);

  return null;
}