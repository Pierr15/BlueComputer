declare module "midtrans-client" {
  type TransactionPayload = Record<string, unknown>;
  class Snap {
    constructor(config: { isProduction: boolean; serverKey: string; clientKey?: string });
    createTransaction(payload: TransactionPayload): Promise<{ token: string; redirect_url: string }>;
  }
  const midtransClient: { Snap: typeof Snap };
  export default midtransClient;
}
