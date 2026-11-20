export type AppRole = "buyer" | "employee" | "owner";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Address = {
  id: string;
  user_id: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
};

export type OrderStatus =
  | "draft"
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipped"
  | "completed"
  | "cancelled"
  | "expired"
  | "payment_failed";

export type Order = {
  id: string;
  user_id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_snapshot: ShippingSnapshot;
  midtrans_order_id: string | null;
  midtrans_snap_token: string | null;
  created_at: string;
  updated_at: string;
};

export type ShippingSnapshot = {
  recipient_name?: string;
  phone?: string;
  address_line?: string;
  city?: string;
  postal_code?: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

export type OrderWithItems = Order & {
  order_items: OrderItem[];
};

export type CurrentUser = {
  id: string;
  email: string;
  role: AppRole;
  profile: Profile;
};

export type ActionState = {
  error?: string;
  success?: string;
};
