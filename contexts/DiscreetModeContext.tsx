import React, { createContext, useContext, useState } from 'react';
import { Platform, Linking } from 'react-native';

interface DiscreetModeContextType {
  isDiscreetMode: boolean;
  setIsDiscreetMode: (val: boolean) => void;
  handleQuickEscape: () => void;
}

const DiscreetModeContext = createContext<DiscreetModeContextType>({
  isDiscreetMode: false,
  setIsDiscreetMode: () => {},
  handleQuickEscape: () => {},
});

export const DiscreetModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDiscreetMode, setIsDiscreetMode] = useState(false);

  const handleQuickEscape = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = 'https://news.google.com';
    } else {
      Linking.openURL('https://news.google.com').catch(() => {});
    }
  };

  return (
    <DiscreetModeContext.Provider value={{ isDiscreetMode, setIsDiscreetMode, handleQuickEscape }}>
      {children}
    </DiscreetModeContext.Provider>
  );
};

export const useDiscreetMode = () => useContext(DiscreetModeContext);
