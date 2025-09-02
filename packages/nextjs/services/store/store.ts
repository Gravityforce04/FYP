import { create } from "zustand";
import scaffoldConfig from "~~/scaffold.config";
import { ChainWithAttributes, NETWORKS_EXTRA_DATA } from "~~/utils/scaffold-eth";

/**
 * Zustand Store
 *
 * You can add global state to the app using this useGlobalState, to get & set
 * values from anywhere in the app.
 *
 * Think about it as a global useState.
 */

type GlobalState = {
  nativeCurrency: {
    price: number;
    isFetching: boolean;
  };
  setNativeCurrencyPrice: (newNativeCurrencyPriceState: number) => void;
  setIsNativeCurrencyFetching: (newIsNativeCurrencyFetching: boolean) => void;
  targetNetwork: ChainWithAttributes;
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => void;
};

// Helper function to get network from localStorage or default to first network
const getInitialNetwork = (): ChainWithAttributes => {
  if (typeof window !== "undefined") {
    const savedNetworkId = localStorage.getItem("scaffold-eth-target-network");
    if (savedNetworkId) {
      const savedNetwork = scaffoldConfig.targetNetworks.find(network => network.id === parseInt(savedNetworkId));
      if (savedNetwork) {
        return { ...savedNetwork, ...NETWORKS_EXTRA_DATA[savedNetwork.id] };
      }
    }
  }

  // Default to first network (hardhat)
  return {
    ...scaffoldConfig.targetNetworks[0],
    ...NETWORKS_EXTRA_DATA[scaffoldConfig.targetNetworks[0].id],
  };
};

export const useGlobalState = create<GlobalState>(set => ({
  nativeCurrency: {
    price: 0,
    isFetching: true,
  },
  setNativeCurrencyPrice: (newValue: number): void =>
    set(state => ({ nativeCurrency: { ...state.nativeCurrency, price: newValue } })),
  setIsNativeCurrencyFetching: (newValue: boolean): void =>
    set(state => ({ nativeCurrency: { ...state.nativeCurrency, isFetching: newValue } })),
  targetNetwork: getInitialNetwork(),
  setTargetNetwork: (newTargetNetwork: ChainWithAttributes) => {
    // Save to localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("scaffold-eth-target-network", newTargetNetwork.id.toString());
    }
    set(() => ({ targetNetwork: newTargetNetwork }));
  },
}));
