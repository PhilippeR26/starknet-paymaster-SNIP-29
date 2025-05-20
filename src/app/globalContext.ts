"use client";
import { create } from "zustand";
 

interface GlobalState {
    txResult: boolean,
    setTxResult: (txResult: boolean) => void,
    transferRequested: boolean,
    setTransferRequested: (transferRequested: boolean) => void,
}

export const useGlobalContext = create<GlobalState>()(set => ({
    txResult: false,
    setTxResult: (txResult: boolean) => { set({ txResult: txResult }) },
    transferRequested: false,
    setTransferRequested: (transferRequested: boolean) => { set({ transferRequested: transferRequested }) },
}));
