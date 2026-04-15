import { z } from "zod";

const apiBaseUrl = process.env.API_URL ?? "http://localhost:3004";

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

export function getInventory(filters: { name?: string }) {
  const searchParams = new URLSearchParams();

  if (filters.name) {
    searchParams.set("name", filters.name);
  }

  const query = searchParams.toString();
  const path = query ? `/inventory?${query}` : "/inventory";

  return getJson(path, z.array(itemSchema));
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

export function postInventory(body: { name: string; cost: number; category: number }) {
  return postJson("/inventory", body, postInventoryResponseSchema);
}
