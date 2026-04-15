import { z } from "zod";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3004";

const departmentSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const municipalitySchema = z.object({
  id: z.number(),
  name: z.string(),
  department: z.number(),
});

const shopSchema = z.object({
  id: z.number(),
  name: z.string(),
  department: z.number(),
  municipality: z.number(),
});

const popularItemSchema = z.object({
  sku: z.number(),
  name: z.string(),
  cost: z.number(),
  category: z.number(),
  total_quantity: z.number(),
});

const itemDetailsSchema = z.object({
  item: z.object({
    sku: z.number(),
    name: z.string(),
    cost: z.number(),
    category: z.number(),
  }),
  shops: z.array(
    z.object({
      shop_id: z.number(),
      shop_name: z.string(),
      quantity: z.number(),
    })
  ),
});

const itemSchema = z.object({
  sku: z.number(),
  name: z.string(),
  cost: z.number(),
  category: z.number(),
  total_quantity: z.number(),
});

const billDetailSchema = z.object({
  sku: z.number(),
  name: z.string(),
  quantity: z.number(),
  unitary_cost: z.number(),
  total_cost: z.number(),
});

const billSchema = z.object({
  id: z.string().uuid(),
  nit: z.string(),
  date: z.string(),
  total_amount: z.number(),
  shop: z.string(),
  detail: z.array(billDetailSchema),
});

export type Department = z.infer<typeof departmentSchema>;
export type Municipality = z.infer<typeof municipalitySchema>;
export type Shop = z.infer<typeof shopSchema>;
export type PopularItem = z.infer<typeof popularItemSchema>;
export type ItemDetails = z.infer<typeof itemDetailsSchema>;
export type Item = z.infer<typeof itemSchema>;
export type BillDetail = z.infer<typeof billDetailSchema>;
export type Bill = z.infer<typeof billSchema>;

async function getJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = await response.json();
  return schema.parse(data);
}

async function postJson<T>(path: string, body: unknown, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (data as { msg?: string; message?: string }).msg
      ?? (data as { msg?: string; message?: string }).message
      ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return schema.parse(data);
}

export function getDepartments() {
  return getJson("/departments", z.array(departmentSchema));
}

export function getMunicipalities() {
  return getJson("/municipalities", z.array(municipalitySchema));
}

export function getShops(filters: {
  name?: string;
  departmentId?: string;
  municipalityId?: string;
}) {
  const searchParams = new URLSearchParams();

  if (filters.name) {
    searchParams.set("name", filters.name);
  }

  if (filters.departmentId) {
    searchParams.set("department_id", filters.departmentId);
  }

  if (filters.municipalityId) {
    searchParams.set("municipality_id", filters.municipalityId);
  }

  const query = searchParams.toString();
  const path = query ? `/shops?${query}` : "/shops";

  return getJson(path, z.array(shopSchema));
}

export function getPopularItemsReport(filters: {
  shopId: number;
  start: number;
  end: number;
}) {
  const searchParams = new URLSearchParams({
    shop_id: String(filters.shopId),
    start: String(filters.start),
    end: String(filters.end),
  });

  return getJson(`/report/popularity?${searchParams.toString()}`, z.array(popularItemSchema));
}

export function getInventory(filters: { name?: string }) {
  const searchParams = new URLSearchParams();

  if (filters.name) {
    searchParams.set("name", filters.name);
  }

  const query = searchParams.toString();
  const path = query ? `/inventory?${query}` : "/inventory";

  return getJson(path, z.array(itemSchema));
}

export function getItemDetails(sku: number) {
  return getJson(`/inventory/${sku}/details`, itemDetailsSchema);
}

export function getBills() {
  return getJson("/bill", z.array(billSchema));
}

const postShopResponseSchema = z.object({
  id: z.number(),
  message: z.string(),
});

export function postShop(body: { name: string; department: number; municipality: number }) {
  return postJson("/shop", body, postShopResponseSchema);
}

const postInventoryResponseSchema = z.object({
  sku: z.number(),
  message: z.string(),
});

const increaseInventoryResponseSchema = z.object({
  message: z.string(),
  new_quantity: z.number(),
});

const transferInventoryResponseSchema = z.object({
  message: z.string(),
  from_shop_new_quantity: z.number(),
  to_shop_new_quantity: z.number(),
});

export function postInventory(body: { name: string; cost: number; category: number }) {
  return postJson("/inventory", body, postInventoryResponseSchema);
}

export function increaseInventory(body: { sku: number; shop: number; quantity: number }) {
  return postJson("/inventory/increase", body, increaseInventoryResponseSchema);
}

export async function transferInventory(body: {
  sku: number;
  from_shop: number;
  to_shop: number;
  quantity: number;
}) {
  const response = await fetch(`${apiBaseUrl}/inventory/${body.sku}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from_shop: body.from_shop,
      to_shop: body.to_shop,
      quantity: body.quantity,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (data as { msg?: string; message?: string }).msg
      ?? (data as { msg?: string; message?: string }).message
      ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return transferInventoryResponseSchema.parse(data);
}

const billDetailResponseSchema = z.object({
  id: z.string().uuid(),
  nit: z.string(),
  date: z.string(),
  total_amount: z.number(),
  detail: z.array(billDetailSchema),
});

export type BillDetailResponse = z.infer<typeof billDetailResponseSchema>;

export function getBillById(billId: string) {
  return getJson(`/bill/${billId}`, billDetailResponseSchema);
}

const postBillResponseSchema = z.object({
  id: z.string().uuid(),
  message: z.string(),
});

export function postBill(body: {
  nit: string;
  shop_id: number;
  detail: { sku: number; quantity: number }[];
}) {
  return postJson("/bill", body, postBillResponseSchema);
}

const itemHistorySchema = z.object({
  sku: z.number(),
  quantity: z.number(),
  unitary_cost: z.number(),
  action_name: z.string(),
  date: z.string(),
  bill: z.string().nullable(),
});

export type ItemHistory = z.infer<typeof itemHistorySchema>;

export function getItemHistory(sku: number) {
  return getJson(`/inventory/${sku}/history`, z.array(itemHistorySchema));
}
