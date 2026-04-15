import { describe, test, expect, beforeAll } from "vitest";
import axios from "axios";
import { object, string, number, array } from "yup";
import { API_URL, handleUnexpectedAxiosError, randomLetters, validateResponse } from "../helpers";

describe("GET List inventory", () => {
    let seededItemName: string;

    beforeAll(async () => {
        seededItemName = randomLetters(10);
        const itemRes = await axios.request({
            url: `${API_URL}/inventory`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: { name: seededItemName, cost: 10.00, category: 1 },
        });
        await axios.request({
            url: `${API_URL}/inventory/increase`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: { sku: itemRes.data.sku, shop: 1, quantity: 5 },
        });
    });

    const BASE_REQUEST = (params: Record<string, string> = {}) => ({
        url: `${API_URL}/inventory`,
        method: "GET",
        params,
    });

    const RESPONSE_SCHEMA = array(
        object({
            sku: number().required(),
            name: string().required(),
            cost: number().required(),
            category: number().required(),
            total_quantity: number().required(),
        })
    ).required();

    test("Success with 200 and returns list matching schema", async () => {
        try {
            const response = await axios.request(BASE_REQUEST());

            expect(response.status).toBe(200);
            await validateResponse(response.data, RESPONSE_SCHEMA);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("All items have valid quantity", async () => {
        try {
            const response = await axios.request(BASE_REQUEST());

            expect(response.status).toBe(200);
            expect(response.data.length).toBeGreaterThan(0);
            await validateResponse(response.data, RESPONSE_SCHEMA);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Filter by name (ILIKE) returns only matching items", async () => {
        try {
            const response = await axios.request(BASE_REQUEST({ name: seededItemName }));

            expect(response.status).toBe(200);
            await validateResponse(response.data, RESPONSE_SCHEMA);
            expect(response.data.length).toBeGreaterThan(0);
            expect(response.data.every((i: any) => i.name.toLowerCase().includes(seededItemName.toLowerCase()))).toBe(true);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Filter by partial name (ILIKE) matches correctly", async () => {
        try {
            const partial = seededItemName.slice(0, 5);
            const response = await axios.request(BASE_REQUEST({ name: partial }));

            expect(response.status).toBe(200);
            await validateResponse(response.data, RESPONSE_SCHEMA);
            expect(response.data.some((i: any) => i.name === seededItemName)).toBe(true);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Filter by name with no matches returns empty array", async () => {
        try {
            const response = await axios.request(BASE_REQUEST({ name: "zzz_no_match_zzz" }));

            expect(response.status).toBe(200);
            expect(response.data.length).toBe(0);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });
});
