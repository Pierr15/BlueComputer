type SnapResult = {
  order_id?: string;
  transaction_status?: string;
  status_code?: string;
  status_message?: string;
  transaction_id?: string;
  payment_type?: string;
  fraud_status?: string;
};

type SnapPayOptions = {
  onSuccess?: (result: SnapResult) => void;
  onPending?: (result: SnapResult) => void;
  onError?: (result: SnapResult) => void;
  onClose?: () => void;
};

interface Window {
  snap?: {
    pay: (token: string, options?: SnapPayOptions) => void;
  };
}
