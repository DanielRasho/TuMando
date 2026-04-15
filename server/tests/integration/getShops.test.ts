import { describe, test, expect } from "vitest";
import axios from "axios";
import { object, string, number, array } from "yup";
import { API_URL, handleUnexpectedAxiosError, validateResponse } from "../helpers";

describe("GET List shops", () => {
    const BASE_REQUEST = () => ({
        url: `${API_URL}/shops`,
        method: "GET",
    });

    const RESPONSE_SCHEMA = array(
        object({
            id: number().required(),
            name: string().required(),
            department: number().required(),
            municipality: number().required(),
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

    test("Response includes the 3 seeded branches", async () => {
        try {
            const response = await axios.request(BASE_REQUEST());

            expect(response.status).toBe(200);
            const names: string[] = response.data.map((s: any) => s.name);
            expect(names).toContain("Central");
            expect(names).toContain("Norte");
            expect(names).toContain("Occidente");
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });
});
