import { describe, test, expect, assert, beforeAll } from "vitest";
import axios, { type AxiosResponse } from "axios";
import { object, string, number, array } from "yup";
import {API_URL, handleExpectedAxiosError, handleUnexpectedAxiosError, modifyObjectAttribute, randomLetters, validateResponse} from "../helpers"
import { url } from "node:inspector";

describe("GET list of shops", () => {
    const BASE_REQUEST = () => {

        const url = new URL(`${API_URL}/shop`);

        const request: any = {
            url: url.toString(),
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            data: {}
        }
        
        return request
    }
    
    const RESPONSE_SCHEMA = array().of(object({
        id: number().required(),
        name: string().required(),
        department: number().required(),
        municipality: number().required()
    })) 
    
    
    test("Success with 200 when creating a shop", async() => {
        try {
            const data = BASE_REQUEST();
            const response = await axios.request(data);

            console.log(response.data);

            expect(response.status).toBe(200);

            await validateResponse(response.data, RESPONSE_SCHEMA);
            
            // expect(response.data.length).toBeGreaterThan(0)

        } catch (err) {
            handleUnexpectedAxiosError(err)
        }
    })
})