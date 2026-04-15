import axios from "axios";
import { Pool } from "pg";

const API_URL = process.env.API_URL ?? "http://127.0.0.1:3004";
const DB_URL = "postgres://postgres:postgres@127.0.0.1:5433/tumando-db"

// --- Singleton Postgres client ---
let bitacoraPool: Pool | null;
let umsPool: Pool | null;

/**
 * Returns a singleton pg Pool instance
 */
function getDb() {
  if (!bitacoraPool) {
    bitacoraPool = new Pool({
      connectionString: DB_URL,
    });
  }
  return ;
}

/**
 * Cleanly close the pool (e.g. after tests)
 */
async function closeDbs() {
  if (bitacoraPool) {
    await bitacoraPool.end();
    bitacoraPool = null;
  }
  if (umsPool) {
    await umsPool.end();
    umsPool = null;
  }
}

// --- Axios helpers ---
/**
 * Use when a request that was expected to success fails. If the error is from axios
 * it throws an error with the request response payload, or else it just throws the error as is.
 */
function handleUnexpectedAxiosError(err: any) {
  if (axios.isAxiosError(err) && err?.response?.data) {
    throw new Error(
      `Error: status ${err.response.status} \n${JSON.stringify(err.response.data, null, "\t")}`
    );
  } else if (axios.isAxiosError(err) && err?.response?.data === "") {
    throw new Error(`Error: status ${err.response.status}`);
  }
  console.log(err);
  throw err;
}

/**
 * Use when a request is expected to fail. If the error is from axios it runs the `validator` callback,
 * by passing the entire response object or else it just throws the error as is.
 * @param {Error} response Reponse to check
 * @param {Function} validator Callback to check payload, if the error comes from axios.
 * @returns {Error}
 */
function handleExpectedAxiosError(
  response: object,
  validator: CallableFunction
) {
  if (axios.isAxiosError(response)) {
    validator(response);
  } else {
    throw response;
  }
}

/**
 * Validates the structure of the given response data using the specified schema.
 *
 * This function ensures that the response data conforms to the provided schema
 * using Yup validation. It throws an error if the validation fails, indicating
 * any discrepancies in the structure of the data.
 *
 * @param responseData - The data object to be validated.
 * @param {Schema} schema - A Yup schema object that defines the expected structure
 * and constraints for the response data.
 * @returns {Promise<void>} - Resolves if the validation is successful, otherwise throws an error.
 * @throws Will throw an error if the response data does not match the provided schema.
 */
async function validateResponse(responseData, schema) {
  try {
    // Validar si la estructura sigue el esquema
    await schema.validate(responseData, {
      strict: true,
      abortEarly: false,
    });
    console.log("Record response structure is valid.");
  } catch (error) {
    console.error(
      "Invalid response structure:",
      error.errors,
      "\nReceived\n",
      JSON.stringify(responseData, null, "\t")
    );
    throw new Error("Schema response validation failed.");
  }
}

/**
 * Makes a request using the specified axios method, and checks if it fails with the expected status and message.
 *
 * @param {string} axiosMethod - The axios method to use (e.g., axios.post, axios.get).
 * @param {string} url - The API endpoint URL to send the request to.
 * @param {headers} [body] - Request headers
 * @param {Object} [params={}] - An object representing query parameters to be included in the request.
 * @param {Object} [body=null] - The request body to be sent (null for GET or HEAD requests).
 * @param {number} expectedCode - The expected HTTP status code for the failure (e.g., 404, 401).
 * @param {string} expectedMsg - The expected error message in the response.
 *
 * @returns {Promise<void>} - Resolves if the response matches expectations, otherwise throws an error.
 */
async function checkFailRequest(
  method,
  url,
  headers,
  params,
  body,
  expectedCode
) {
  try {
    const response = await axios.request({
      method,
      url,
      headers,
      params,
      data: body,
    });
    if (response.status >= 200 && response.status < 300) {
      throw new Error(
        `Expected a failure, but got response with status: ${response.status}`
      );
    }
  } catch (error) {
    handleExpectedAxiosError(error, () => {
      expect(error.response.status).toBe(expectedCode);
    });
  }
}

/**
 * Makes a clone of a object and applies a function to each element of a list attribute within the object.
 * @param {object} object: Record object to modify
 * @param {*} arrayPath: path of nested fields to get to the target field. Ex: "animal.food.vegetables"
 *                           will target and object like { animal : { food: { vegetables : [] } }}
 * @param {*} modification: Function to modify each of the values in the array field.
 * @returns the clone record with the array field changed.
 */
function modifyObjectArray(object, arrayPath, modification) {
  const newObject = JSON.parse(JSON.stringify(object));

  // Navigate the object to the array specified by the arrayPath
  const pathParts = arrayPath.split(".");
  let target = newObject;

  // Traverse all parts of the path except the last one
  for (let i = 0; i < pathParts.length - 1; i++) {
    target = target[pathParts[i]];
  }
  const finalKey = pathParts[pathParts.length - 1];
  target[finalKey] = target[finalKey].map((field) => {
    return modification(field);
  });

  return newObject;
}

/**
 * Makes a clone of an object but by changing one field value.
 * @param {object} object: Object object to modify
 * @param {*} attributePath: path of nested fields to get to the target field. Ex: "animal.food.vegetables"
 *                           will target and object like { animal : { food: { vegetables : "value" } }}
 * @param {*} newValue: Value to replace on the specified field
 * @returns the clone record with the field changed.
 */
function modifyObjectAttribute(object, attributePath, newValue) {
  const newObject = JSON.parse(JSON.stringify(object));

  // Navigate the object to the array specified by the arrayPath
  const pathParts = attributePath.split(".");
  let targetAttribute = newObject;

  // Traverse all parts of the path except the last one
  for (let i = 0; i < pathParts.length - 1; i++) {
    targetAttribute = targetAttribute[pathParts[i]];
  }

  const finalKey = pathParts[pathParts.length - 1];
  targetAttribute[finalKey] = newValue;

  return newObject;
}

/**
 * Makes a clone of an object and modifies multiple nested fields from a map.
 * @param {object} object - The original object to clone and modify.
 * @param {object} changesMap - An object where keys are dot-separated paths and values are the new values.
 * @returns {object} A new object with the specified updates applied.
 */
function modifyObjectAttributesFromMap(
  object: object,
  changesMap: object
): object {
  const newObject = JSON.parse(JSON.stringify(object));

  for (const [path, value] of Object.entries(changesMap)) {
    const pathParts = path.split(".");
    let target = newObject;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!(part in target)) {
        target[part] = {}; // Create nested structure if missing
      }
      target = target[part];
    }

    const finalKey = pathParts[pathParts.length - 1];
    target[finalKey] = value;
  }

  return newObject;
}

/**
 * Makes a clone of a Record object but deletes a specified attribute.
 * @param {object} record: Record object to modify
 * @param {string} attributePath: Path to the attribute to delete (e.g., 'patient.info.age')
 * @returns the cloned record with the attribute deleted.
 */
function deleteObjectAttribute(record: object, attributePath: string): object {
  const newRecord = JSON.parse(JSON.stringify(record)); // Deep copy the object

  // Split the path into parts
  const pathParts = attributePath.split(".");
  let targetAttribute = newRecord;

  // Traverse all parts of the path except the last one
  for (let i = 0; i < pathParts.length - 1; i++) {
    targetAttribute = targetAttribute[pathParts[i]];
  }

  // Delete the attribute at the end of the path
  const finalKey = pathParts[pathParts.length - 1];
  delete targetAttribute[finalKey];

  return newRecord; // Return the modified clone
}

function randomLetters(n: number) {
  const vowels = "aeiou";
  const consonants = "bcdfghjklmnpqrstvwxyz";
  const allLetters = vowels + consonants;

  let result = "";
  for (let i = 0; i < n; i++) {
    const randomIndex = Math.floor(Math.random() * allLetters.length);
    result += allLetters[randomIndex];
  }
  return result;
}

export {
    API_URL,
    handleExpectedAxiosError,
    handleUnexpectedAxiosError,
    DB_URL,
    validateResponse,
    checkFailRequest,
    modifyObjectArray,
    modifyObjectAttribute,
    modifyObjectAttributesFromMap,
    deleteObjectAttribute,
    randomLetters,
}
