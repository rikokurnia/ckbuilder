"use client";

import React, { ReactNode } from "react";
import { ccc } from "@ckb-ccc/connector-react";

export function CccWrapper({ children }: { children: ReactNode }) {
  return (
    <ccc.Provider
      defaultClient={
        new ccc.ClientPublicTestnet({
          url: "https://testnet.ckb.dev/rpc",
        })
      }
      name="CKB CCC Memo DApp"
    >
      {children}
    </ccc.Provider>
  );
}
