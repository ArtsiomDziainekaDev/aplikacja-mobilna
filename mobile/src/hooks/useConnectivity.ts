import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/** Hook do sprawdzania połączenia sieciowego (NetInfo). */
export function useConnectivity(): boolean {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  return isConnected ?? false;
}
