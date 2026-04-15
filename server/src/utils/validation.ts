import { type Schema } from "yup";

/**
 * Validates an object against a Yup schema.
 * Throws a Yup ValidationError if the data does not conform.
 * Type coercion is disabled — wrong types are rejected, not silently cast.
 * All errors are collected before throwing.
 */
export async function validateBody<T>(data: unknown, schema: Schema<T>): Promise<T> {
    return schema.validate(data, { abortEarly: false, strict: true });
}
