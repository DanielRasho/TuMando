import { describe, test, expect, beforeAll } from "vitest";
import axios from "axios";
import { object, string, number, array } from "yup";
import { API_URL, handleUnexpectedAxiosError, randomLetters, validateResponse } from "../helpers";

describe("GET Shop details", () => {
    beforeAll(async () => {
        const itemRes = await axios.request({
            url: `${API_URL}/inventory`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: { name: randomLetters(10), cost: 20.00, category: 1 },
        });
        await axios.request({
            url: `${API_URL}/inventory/increase`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: { sku: itemRes.data.sku, shop: 1, quantity: 5 },
        });
    });

    const BASE_REQUEST = (shopId: number) => ({
        url: `${API_URL}/shop/${shopId}`,
        method: "GET",
    });

    const RESPONSE_SCHEMA = object({
        shop: object({
            id: number().required(),
            name: string().required(),
            department: number().required(),
            municipality: number().required(),
            date: string().required(),
        }).required(),
        items: array(
            object({
                sku: number().required(),
                name: string().required(),
                quantity: number().required(),
            })
        ).required(),
    }).required();

    test("Success with 200 and returns shop details matching schema", async () => {
        try {
            const response = await axios.request(BASE_REQUEST(1));

            expect(response.status).toBe(200);
            await validateResponse(response.data, RESPONSE_SCHEMA);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Returns all items for the shop", async () => {
        try {
            const response = await axios.request(BASE_REQUEST(1));

            expect(response.status).toBe(200);
            expect(response.data.shop.id).toBe(1);
            await validateResponse(response.data, RESPONSE_SCHEMA);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Fail with 404 when shop does not exist", async () => {
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
