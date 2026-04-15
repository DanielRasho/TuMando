import { describe, test, expect, beforeAll } from "vitest";
import axios from "axios";
import { object, string, number, array } from "yup";
import { API_URL, handleUnexpectedAxiosError, randomLetters, validateResponse } from "../helpers";

describe("GET Bill by ID", () => {
    const BILL_URL = `${API_URL}/bill`;
    let itemSku: number;

    beforeAll(async () => {
        const itemRes = await axios.request({
            url: `${API_URL}/inventory`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: { name: randomLetters(10), cost: 45.00, category: 1 },
        });
        itemSku = itemRes.data.sku;

        await axios.request({
            url: `${API_URL}/inventory/increase`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: { sku: itemSku, shop: 1, quantity: 50 },
        });
    });

    const RESPONSE_SCHEMA = object({
        id: string().uuid().required(),
        nit: string().required(),
        date: string().required(),
        total_amount: number().required(),
        detail: array(
            object({
                sku: number().required(),
                name: string().required(),
                quantity: number().required(),
                unitary_cost: number().required(),
                total_cost: number().required()
            })
        ).required()
    });

    test("Success with 200 and returns bill matching schema", async () => {
        try {
            // Create a bill first to ensure we have a known ID
            const createResponse = await axios.request({
                url: BILL_URL,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                data: {
                    nit: "743910-5",
                    shop_id: 1,
                    detail: [{ sku: itemSku, quantity: 1 }]
                }
            });

            expect(createResponse.status).toBe(200);
            const billId = createResponse.data.id;

            const response = await axios.request({
                url: `${BILL_URL}/${billId}`,
                method: "GET",
            });

            expect(response.status).toBe(200);
            await validateResponse(response.data, RESPONSE_SCHEMA);
            expect(response.data.id).toBe(billId);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Bill detail contains all purchased items", async () => {
        try {
            const createResponse = await axios.request({
                url: BILL_URL,
                method: "POST",
                headers: { "Content-Type": "application/json" },
                data: {
                    nit: "743910-5",
                    shop_id: 1,
                    detail: [{ sku: itemSku, quantity: 1 }]
                }
            });

            expect(createResponse.status).toBe(200);
            const billId = createResponse.data.id;

            const response = await axios.request({
                url: `${BILL_URL}/${billId}`,
                method: "GET",
            });

            expect(response.status).toBe(200);
            expect(response.data.detail.length).toBe(1);
            expect(response.data.detail[0].sku).toBe(itemSku);
            expect(response.data.detail[0].quantity).toBe(1);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Fail with 404 when bill does not exist", async () => {
        try {
            const response = await axios.request({
                url: `${BILL_URL}/00000000-0000-0000-0000-000000000000`,
                method: "GET",
            });

            expect(response.status).toBe(404);
        } catch (err: any) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                expect(err.response.status).toBe(404);
            } else {
                handleUnexpectedAxiosError(err);
            }
        }
    });
});
