import { describe, test, expect } from "vitest";
import axios from "axios";
import { object, string, number } from "yup";
import { API_URL, handleExpectedAxiosError, handleUnexpectedAxiosError, validateResponse } from "../helpers";

describe("POST Create bill", () => {
    const BASE_REQUEST = () => ({
        url: `${API_URL}/bill`,
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        data: {
            nit: "743910-5",
            shop_id: 1,
            detail: [
                { sku: 1, quantity: 1 }
            ]
        }
    });

    const RESPONSE_SCHEMA = object({
        message: string().required(),
        id: string().uuid().required()
    });

    test("Success with 200 when creating a bill", async () => {
        try {
            const response = await axios.request(BASE_REQUEST());

            console.log(response.data);

            expect(response.status).toBe(200);
            await validateResponse(response.data, RESPONSE_SCHEMA);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Fail with 400 when nit exceeds max length", async () => {
        try {
            const data = {
                ...BASE_REQUEST(),
                data: { ...BASE_REQUEST().data, nit: "12345678901" } // 11 chars, over limit of 10
            };

            const response = await axios.request(data);
            expect(response.status < 200 || response.status > 299).toBe(true);
        } catch (err) {
            handleExpectedAxiosError(err as Object, (response) => {
                expect(response.response.status).toBe(400);
            });
        }
    });

    test("Fail with 400 when detail is empty", async () => {
        try {
            const data = {
                ...BASE_REQUEST(),
                data: { ...BASE_REQUEST().data, detail: [] }
            };

            const response = await axios.request(data);
            expect(response.status < 200 || response.status > 299).toBe(true);
        } catch (err) {
            handleExpectedAxiosError(err as Object, (response) => {
                expect(response.response.status).toBe(400);
            });
        }
    });

    test("Fail with 400 when quantity exceeds available inventory", async () => {
        try {
            const data = {
                ...BASE_REQUEST(),
                data: {
                    ...BASE_REQUEST().data,
                    detail: [{ sku: 1, quantity: 999999 }]
                }
            };

            const response = await axios.request(data);
            expect(response.status < 200 || response.status > 299).toBe(true);
        } catch (err) {
            handleExpectedAxiosError(err as Object, (response) => {
                expect(response.response.status).toBe(400);
            });
        }
    });
});
