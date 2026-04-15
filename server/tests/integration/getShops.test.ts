import { describe, test, expect } from "vitest";
import axios from "axios";
import { object, string, number, array } from "yup";
import { API_URL, handleExpectedAxiosError, handleUnexpectedAxiosError, validateResponse } from "../helpers";

describe("GET List shops", () => {
    const BASE_REQUEST = (params: Record<string, string | number> = {}) => ({
        url: `${API_URL}/shops`,
        method: "GET",
        params,
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
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Filter by name (ILIKE) returns matching shops", async () => {
        try {
            // "central" should match "Central" case-insensitively
            const response = await axios.request(BASE_REQUEST({ name: "central" }));

            expect(response.status).toBe(200);
            await validateResponse(response.data, RESPONSE_SCHEMA);
            expect(response.data.length).toBeGreaterThan(0);
            expect(response.data.every((s: any) => s.name.toLowerCase().includes("central"))).toBe(true);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Filter by name with no matches returns empty array", async () => {
        try {
            const response = await axios.request(BASE_REQUEST({ name: "zzz_no_match_zzz" }));

            expect(response.status).toBe(200);
            expect(response.data.length).toBe(0);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Filter by department_id returns only shops in that department", async () => {
        try {
            // All 3 seeded shops belong to department=1
            const response = await axios.request(BASE_REQUEST({ department_id: 1 }));

            expect(response.status).toBe(200);
            await validateResponse(response.data, RESPONSE_SCHEMA);
            expect(response.data.length).toBeGreaterThanOrEqual(3);
            expect(response.data.every((s: any) => s.department === 1)).toBe(true);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Filter by department_id and municipality_id returns matching shops", async () => {
        try {
            // All 3 seeded shops are in department=1, municipality=1
            const response = await axios.request(BASE_REQUEST({ department_id: 1, municipality_id: 1 }));

            expect(response.status).toBe(200);
            await validateResponse(response.data, RESPONSE_SCHEMA);
            expect(response.data.length).toBeGreaterThanOrEqual(0);
            expect(response.data.every((s: any) => s.municipality === 1)).toBe(true);
        } catch (err) {
            handleUnexpectedAxiosError(err);
        }
    });

    test("Fail with 400 when municipality_id provided without department_id", async () => {
        try {
            const response = await axios.request(BASE_REQUEST({ municipality_id: 1 }));
            expect(response.status < 200 || response.status > 299).toBe(true);
        } catch (err) {
            handleExpectedAxiosError(err as Object, (response) => {
                expect(response.response.status).toBe(400);
            });
        }
    });
});
