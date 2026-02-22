'use client';

import { createContext, useContext } from 'react';

export const CurrencyContext = createContext('USD');

export const useCurrency = () => useContext(CurrencyContext);
