"use client";
import { create } from "zustand";
 

interface GlobalState {
    txResult: boolean,
    setTxResult: (txResult: boolean) => void,
}

export const useGlobalContext = create<GlobalState>()(set => ({
    txResult: false,
    setTxResult: (txResult: boolean) => { set({ txResult: txResult }) }
}));
