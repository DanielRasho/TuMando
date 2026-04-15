import { describe, test, expect, beforeAll } from "vitest";
import axios from "axios";
import { object, string, number, array } from "yup";
import { API_URL, handleUnexpectedAxiosError, randomLetters, validateResponse } from "../helpers";

describe("GET Item details", () => {
    let itemSku: number;

    beforeAll(async () => {
        const itemRes = await axios.request({
            url: `${API_URL}/inventory`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: { name: randomLetters(10), cost: 75.00, category: 1 },
        });
        itemSku = itemRes.data.sku;

        // add stock to shop 1 so the shops list is non-empty
        await axios.request({
            url: `${API_URL}/inventory/increase`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: { sku: itemSku, shop: 1, quantity: 10 },
        });
    });

    const BASE_REQUEST = (sku: number) => ({
        url: `${API_URL}/inventory/${sku}/details`,
        method: "GET",
    });

    const RESPONSE_SCHEMA = object({
        item: object({
            sku: number().required(),
            name: string().required(),
            cost: number().required(),
            category: number().required(),
        }).required(),
        shops: array(
            object({
                shop_id: number().required(),
                shop_name: string().required(),
                quantity: number().required(),
            })
        ).required(),
    }).required();

    test("Success with 200 and returns item details matching schema", async () => {
        try {
            const response = await axios.request(BASE_REQUEST(itemSku));

            expect(response.status).toBe(200);
            await validateResponse(response.data, RESPONSE_SCHEMA);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Returns all shops for the item", async () => {
        try {
            const response = await axios.request(BASE_REQUEST(itemSku));

            expect(response.status).toBe(200);
            expect(response.data.shops.length).toBeGreaterThan(0);
            await validateResponse(response.data, RESPONSE_SCHEMA);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Fail with 404 when item does not exist", async () => {
        try {
            const response = await axios.request(BASE_REQUEST(99999));

            expect(response.status).toBe(404);
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                expect(err.response.status).toBe(404);
            } else {
                handleUnexpectedAxiosError(err);
            }
        }
    });

    test("Fail with 400 when id is not a number", async () => {
        try {
            const response = await axios.request(BASE_REQUEST(NaN));

            expect(response.status).toBe(400);
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response?.status === 400) {
                expect(err.response.status).toBe(400);
            } else {
                handleUnexpectedAxiosError(err);
            }
        }
    });
});
