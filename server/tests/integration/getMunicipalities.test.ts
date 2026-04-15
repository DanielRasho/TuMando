import { describe, test, expect } from "vitest";
import axios from "axios";
import { object, string, number, array } from "yup";
import { API_URL, handleUnexpectedAxiosError, validateResponse } from "../helpers";

describe("GET List municipalities", () => {
    const BASE_REQUEST = () => ({
        url: `${API_URL}/municipalities`,
        method: "GET",
    });

    const RESPONSE_SCHEMA = array(
        object({
            id: number().required(),
            name: string().required(),
            department: number().required(),
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

    test("Every municipality has a valid department reference", async () => {
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
