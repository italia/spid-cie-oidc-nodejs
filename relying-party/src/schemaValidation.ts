import Ajv from "ajv";
import addFormats from "ajv-formats"
import authenticationRequestSchema from "./schemas/authentication-request.json";
import authenticationResponseSchema from "./schemas/authentication-response.json";

const ajv = new Ajv();
addFormats(ajv)

export const validateAuthenticationRequest = ajv.compile(authenticationRequestSchema);
export const validateAuthenticationResponse = ajv.compile(authenticationResponseSchema);


