import { describe, test, expect, beforeAll } from "vitest";
import axios from "axios";
import { object, string, number, array } from "yup";
import { API_URL, handleUnexpectedAxiosError, randomLetters, validateResponse } from "../helpers";

describe("GET Item history", () => {
    let itemSku: number;

    beforeAll(async () => {
        const itemRes = await axios.request({
            url: `${API_URL}/inventory`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: { name: randomLetters(10), cost: 50.00, category: 1 },
        });
        itemSku = itemRes.data.sku;

        // increase creates a history entry with action "buy"
        await axios.request({
            url: `${API_URL}/inventory/increase`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: { sku: itemSku, shop: 1, quantity: 10 },
        });
    });

    const BASE_REQUEST = (sku: number) => ({
        url: `${API_URL}/inventory/${sku}/history`,
        method: "GET",
    });

    const RESPONSE_SCHEMA = array(
        object({
            sku: number().required(),
            quantity: number().required(),
            unitary_cost: number().required(),
            action_name: string().required(),
            date: string().required(),
            bill: string().nullable(),
        })
    ).required();

    test("Success with 200 and returns history matching schema", async () => {
        try {
            const response = await axios.request(BASE_REQUEST(itemSku));

            expect(response.status).toBe(200);
            await validateResponse(response.data, RESPONSE_SCHEMA);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Returns history ordered by date descending", async () => {
        try {
            const response = await axios.request(BASE_REQUEST(itemSku));

            expect(response.status).toBe(200);

            if (response.data.length > 1) {
                for (let i = 0; i < response.data.length - 1; i++) {
                    const currentDate = new Date(response.data[i].date);
                    const nextDate = new Date(response.data[i + 1].date);
                    expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
                }
            }
        } catch (err) {
            handleUnexpectedAxiosError(err);
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
