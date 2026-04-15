import { describe, test, expect, beforeAll } from "vitest";
import axios from "axios";
import { object, string, number, array } from "yup";
import { API_URL, handleExpectedAxiosError, handleUnexpectedAxiosError, randomLetters, validateResponse } from "../helpers";

describe("GET Popularity Report", () => {
    const SHOP_ID = 1;
    let itemSku: number;

    // Capture the time window around the beforeAll sells
    let windowStart: number;
    let windowEnd: number;

    beforeAll(async () => {
        // Create an item and add stock so we can sell it
        const itemRes = await axios.request({
            url: `${API_URL}/inventory`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: { name: randomLetters(10), cost: 150.00, category: 1 },
        });
        itemSku = itemRes.data.sku;

        await axios.request({
            url: `${API_URL}/inventory/increase`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: { sku: itemSku, shop: SHOP_ID, quantity: 20 },
        });

        // Record timestamp just before the sale
        windowStart = Math.floor(Date.now() / 1000) - 5;

        // Create a bill (records sell in inventory_history with action=2)
        await axios.request({
            url: `${API_URL}/bill`,
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: {
                nit: "743910-5",
                shop_id: SHOP_ID,
                detail: [{ sku: itemSku, quantity: 5 }],
            },
        });

        // Record timestamp just after the sale
        windowEnd = Math.floor(Date.now() / 1000) + 5;
    });

    const BASE_REQUEST = (
        shop_id: number,
        start_date: number,
        end_date: number
    ) => {
        const url = new URL(`${API_URL}/report/popularity`);
        url.searchParams.append("shop_id", shop_id.toString());
        url.searchParams.append("start", start_date.toString());
        url.searchParams.append("end", end_date.toString());
        return { url: url.toString(), method: "GET" };
    };

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
            const response = await axios.request(BASE_REQUEST(SHOP_ID, windowStart, windowEnd));

            expect(response.status).toBe(200);
            await validateResponse(response.data, RESPONSE_SCHEMA);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Sold item appears in results within correct date range", async () => {
        try {
            const response = await axios.request(BASE_REQUEST(SHOP_ID, windowStart, windowEnd));

            expect(response.status).toBe(200);
            expect(response.data.length).toBeGreaterThan(0);

            const match = response.data.find((i: any) => i.sku === itemSku);
            expect(match).toBeDefined();
            expect(match.total_quantity).toBe(5);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Results are sorted by total_quantity descending", async () => {
        try {
            const response = await axios.request(BASE_REQUEST(SHOP_ID, windowStart, windowEnd));

            expect(response.status).toBe(200);

            for (let i = 0; i < response.data.length - 1; i++) {
                expect(response.data[i].total_quantity).toBeGreaterThanOrEqual(
                    response.data[i + 1].total_quantity
                );
            }
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Returns empty array when no sells exist in date range", async () => {
        try {
            // Use a date range far in the past (year 2000)
            const pastStart = 946684800; // 2000-01-01 00:00:00 UTC
            const pastEnd   = 946684860; // 2000-01-01 00:01:00 UTC

            const response = await axios.request(BASE_REQUEST(SHOP_ID, pastStart, pastEnd));

            expect(response.status).toBe(200);
            expect(response.data.length).toBe(0);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Fail with 400 when shop_id is missing", async () => {
        try {
            const url = new URL(`${API_URL}/report/popularity`);
            url.searchParams.append("start", windowStart.toString());
            url.searchParams.append("end",   windowEnd.toString());

            const response = await axios.request({ url: url.toString(), method: "GET" });
            expect(response.status < 200 || response.status > 299).toBe(true);
        } catch (err) {
            handleExpectedAxiosError(err as Object, (response) => {
                expect(response.response.status).toBe(400);
            });
        }
    });

    test("Fail with 400 when start or end is missing", async () => {
        try {
            const url = new URL(`${API_URL}/report/popularity`);
            url.searchParams.append("shop_id", SHOP_ID.toString());
            url.searchParams.append("start",   windowStart.toString());
            // end intentionally omitted

            const response = await axios.request({ url: url.toString(), method: "GET" });
            expect(response.status < 200 || response.status > 299).toBe(true);
        } catch (err) {
            handleExpectedAxiosError(err as Object, (response) => {
                expect(response.response.status).toBe(400);
            });
        }
    });

    test("Fail with 400 when end is before start", async () => {
        try {
            const response = await axios.request(BASE_REQUEST(SHOP_ID, windowEnd, windowStart));
            expect(response.status < 200 || response.status > 299).toBe(true);
        } catch (err) {
            handleExpectedAxiosError(err as Object, (response) => {
                expect(response.response.status).toBe(400);
            });
        }
    });
});
