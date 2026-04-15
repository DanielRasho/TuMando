import { describe, test, expect } from "vitest";
import axios from "axios";
import { object, string, number } from "yup";
import { API_URL, handleExpectedAxiosError, handleUnexpectedAxiosError, modifyObjectAttribute, validateResponse } from "../helpers";

describe("PUT Transfer item between shops", () => {
    const BASE_REQUEST = () => ({
        url: `${API_URL}/inventory/1`,
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        data: {
            from_shop: 1,
            to_shop: 2,
            quantity: 2
        }
    });

    const RESPONSE_SCHEMA = object({
        message: string().required(),
        from_shop_new_quantity: number().required(),
        to_shop_new_quantity: number().required()
    });

    test("Success with 200 when transferring item between shops", async () => {
        try {
            const data = BASE_REQUEST();
            const response = await axios.request(data);

            console.log(response.data);

            expect(response.status).toBe(200);
            await validateResponse(response.data, RESPONSE_SCHEMA);
            expect(response.data.from_shop_new_quantity).toBeGreaterThanOrEqual(0);
            expect(response.data.to_shop_new_quantity).toBeGreaterThan(0);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Fail with 400 when from_shop and to_shop are the same", async () => {
        try {
            const data = modifyObjectAttribute(BASE_REQUEST(), "data.to_shop", 1);

            const response = await axios.request(data);

            console.log(response.data);

            expect(response.status < 200 || response.status > 299).toBe(true);
        } catch (err) {
            handleExpectedAxiosError(err as Object, (response) => {
                expect(response.response.status).toBe(400);
            });
        }
    });

    test("Fail with 400 when transferring more than available quantity", async () => {
        try {
            const data = modifyObjectAttribute(BASE_REQUEST(), "data.quantity", 999999);

            const response = await axios.request(data);

            console.log(response.data);

            expect(response.status < 200 || response.status > 299).toBe(true);
        } catch (err) {
            handleExpectedAxiosError(err as Object, (response) => {
                expect(response.response.status).toBe(400);
            });
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
