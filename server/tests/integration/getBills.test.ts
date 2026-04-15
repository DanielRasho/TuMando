import { describe, test, expect, beforeAll } from "vitest";
import axios from "axios";
import { object, string, number, array } from "yup";
import { API_URL, handleUnexpectedAxiosError, randomLetters, validateResponse } from "../helpers";

describe("GET List of bills", () => {
    beforeAll(async () => {
        const itemRes = await axios.request({
            url: `${API_URL}/inventory`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: { name: randomLetters(10), cost: 30.00, category: 1 },
        });
        const sku = itemRes.data.sku;

        await axios.request({
            url: `${API_URL}/inventory/increase`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: { sku, shop: 1, quantity: 10 },
        });

        await axios.request({
            url: `${API_URL}/bill`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: { nit: "743910-5", shop_id: 1, detail: [{ sku, quantity: 1 }] },
        });
    });

    const BASE_REQUEST = () => ({
        url: `${API_URL}/bill`,
        method: "GET",
    });

    const RESPONSE_SCHEMA = array(
        object({
            id: string().uuid().required(),
            nit: string().required(),
            date: string().required(),
            total_amount: number().required(),
            shop: string().required(),
            detail: array(
                object({
                    sku: number().required(),
                    name: string().required(),
                    quantity: number().required(),
                    unitary_cost: number().required(),
                    total_cost: number().required()
                })
            ).required()
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

    test("Returns at least one bill after postBill tests ran", async () => {
        try {
            const response = await axios.request(BASE_REQUEST());

            expect(response.status).toBe(200);
            expect(response.data.length).toBeGreaterThan(0);
            await validateResponse(response.data, RESPONSE_SCHEMA);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });
});
