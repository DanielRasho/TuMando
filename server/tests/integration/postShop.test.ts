import { describe, test, expect, assert, beforeAll } from "vitest";
import axios, { type AxiosResponse } from "axios";
import { object, string, number, array } from "yup";
import {API_URL, handleExpectedAxiosError, handleUnexpectedAxiosError, modifyObjectAttribute, randomLetters, validateResponse} from "../helpers"

describe("POST Create shop", () => {
    const BASE_REQUEST = () => {

        const url = new URL(`${API_URL}/shop`);

        const request: any = {
            url: url.toString(),
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            data: {
                name: randomLetters(10),    // string
                department: 1,              // number
                municipality: 1             // number
            }
        }
        
        return request
    }
    
    const RESPONSE_SCHEMA = object({
        id: number().required(),
        message: string().required()
    })
    
    
    test("Success with 200 when creating a shop", async() => {
        try {
            const data = BASE_REQUEST();
            const response = await axios.request(data);

            console.log(response.data);

            expect(response.status).toBe(200);

            await validateResponse(response.data, RESPONSE_SCHEMA);
        } catch (err) {
            handleUnexpectedAxiosError(err)
        }
    })
    
    test("Fail with 400 when sending fields of invalid types", async() => {
        try {
            const data = modifyObjectAttribute(BASE_REQUEST(), "data.name", 3);

            const response = await axios.request(data);

            console.log(response.data);

            expect(response.status < 200 || response.status > 299).toBe(true);
        } catch (err) {
            handleExpectedAxiosError(err as Object, (response) => {
                expect(response.response.status).toBe(400);
            });
        }
    })
    
})