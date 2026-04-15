import { describe, test, expect } from "vitest";
import axios from "axios";
import { object, string, number } from "yup";
import { API_URL, handleExpectedAxiosError, handleUnexpectedAxiosError, modifyObjectAttribute, validateResponse } from "../helpers";

describe("POST Increase item quantity", () => {
    const BASE_REQUEST = () => ({
        url: `${API_URL}/inventory/increase`,
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        data: {
            sku: 1,
            shop: 1,
            quantity: 5
        }
    });

    const RESPONSE_SCHEMA = object({
        message: string().required(),
        new_quantity: number().required()
    });

    test("Success with 200 when increasing item quantity", async () => {
        try {
            const data = BASE_REQUEST();
            const response = await axios.request(data);

            console.log(response.data);

            expect(response.status).toBe(200);
            await validateResponse(response.data, RESPONSE_SCHEMA);
            expect(response.data.new_quantity).toBeGreaterThan(0);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Multiple increases accumulate correctly", async () => {
        try {
            const data1 = BASE_REQUEST();
            const response1 = await axios.request(data1);

            expect(response1.status).toBe(200);
            const firstIncrease = response1.data.new_quantity;

            const data2 = BASE_REQUEST();
            const response2 = await axios.request(data2);

            expect(response2.status).toBe(200);
            const secondIncrease = response2.data.new_quantity;

            // Second increase should be 5 more than first
            expect(secondIncrease).toBe(firstIncrease + 5);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Fail with 400 when sending invalid types", async () => {
        try {
            const data = modifyObjectAttribute(BASE_REQUEST(), "data.quantity", "invalid");

            const response = await axios.request(data);

            console.log(response.data);

            expect(response.status < 200 || response.status > 299).toBe(true);
        } catch (err) {
            handleExpectedAxiosError(err as Object, (response) => {
                expect(response.response.status).toBe(400);
            });
        }
    });
});
