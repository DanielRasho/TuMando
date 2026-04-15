import { describe, test, expect } from "vitest";
import axios from "axios";
import { object, string, number } from "yup";
import { API_URL, handleExpectedAxiosError, handleUnexpectedAxiosError, modifyObjectAttribute, randomLetters, validateResponse } from "../helpers";

describe("POST Create item", () => {
    const BASE_REQUEST = () => ({
        url: `${API_URL}/inventory`,
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        data: {
            name: randomLetters(10),
            cost: 99.99,
            category: 1
        }
    });

    const RESPONSE_SCHEMA = object({
        sku: number().required(),
        message: string().required()
    });

    test("Success with 200 when creating an item", async () => {
        try {
            const data = BASE_REQUEST();
            const response = await axios.request(data);

            console.log(response.data);

            expect(response.status).toBe(200);
            await validateResponse(response.data, RESPONSE_SCHEMA);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Fail with 400 when sending fields of invalid types", async () => {
        try {
            const data = modifyObjectAttribute(BASE_REQUEST(), "data.cost", "invalid");

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
