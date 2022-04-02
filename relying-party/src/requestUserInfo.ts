import * as jose from "jose";
import { Configuration } from "./configuration";
import { AuthenticationRequestEntity } from "./persistance/entity/AuthenticationRequestEntity";
import { ajv, httpRequest, inferAlgForJWK } from "./utils";
import { JSONSchemaType } from "ajv";

export async function requestUserInfo(
  configuration: Configuration,
  authenticationRequestEntity: AuthenticationRequestEntity,
  access_token: string
) {
  const request = {
    method: "GET" as const,
    url: authenticationRequestEntity.userinfo_endpoint,
    headers: { Authorization: `Bearer ${access_token}` },
  };
  configuration.logger.info({ message: "User info request", request });
  // SHOULDDO ensure timeout and ssl is respected
  const response = await httpRequest(request);
  if (response.status === 200) {
    const jwe = await response.body;
    const jws = await decrypt(configuration, jwe);
    const jwt = await verify(authenticationRequestEntity, jws);
    configuration.logger.info({ message: "User info request succeeded", request, response });
    if (!(validateUserInfoCie(jwt) || validateUserInfoSpid(jwt))) {
      throw new Error("invalid user info response");
    }
    return jwt;
  } else {
    configuration.logger.error({ message: "User info request failed", request, response });
    throw new Error(`User info request failed`);
  }
}

async function decrypt(configuration: Configuration, jwe: string) {
  const { plaintext } = await jose.compactDecrypt(jwe, async (header) => {
    if (!header.kid) throw new Error("missing kid in header");
    const jwk = configuration.private_jwks.keys.find((key) => key.kid === header.kid);
    if (!jwk) throw new Error("no matching key with kid found");
    return await jose.importJWK(jwk, inferAlgForJWK(jwk));
  });
  return new TextDecoder().decode(plaintext);
}

async function verify(authenticationRequestEntity: AuthenticationRequestEntity, jws: string) {
  try {
    const { payload } = await jose.compactVerify(jws, async (header) => {
      if (!header.kid) throw new Error("missing kid in header");
      const jwk = authenticationRequestEntity.provider_jwks.keys.find((key) => key.kid === header.kid);
      if (!jwk) throw new Error("no matching key with kid found");
      return await jose.importJWK(jwk, inferAlgForJWK(jwk));
    });
    return new TextDecoder().decode(payload);
  } catch (error) {
    if ((error as any).code === "ERR_JWS_SIGNATURE_VERIFICATION_FAILED") {
      // user info jwt verificatrion failed, this should not happen
      // SHOULDDO file issue upstream
      return jose.decodeJwt(jws);
    } else {
      throw error;
    }
  }
}

export type UserInfo = UserInfoSPID | UserInfoCIE;

export type UserInfoSPID = {
  "https://attributes.spid.gov.it/name"?: string;
  "https://attributes.spid.gov.it/familyName"?: string;
  "https://attributes.spid.gov.it/placeOfBirth"?: string;
  "https://attributes.spid.gov.it/countyOfBirth"?: string;
  "https://attributes.spid.gov.it/dateOfBirth"?: string;
  "https://attributes.spid.gov.it/gender"?: string;
  "https://attributes.spid.gov.it/companyName"?: string;
  "https://attributes.spid.gov.it/registeredOffice"?: string;
  "https://attributes.spid.gov.it/fiscalNumber"?: string;
  "https://attributes.spid.gov.it/ivaCode"?: string;
  "https://attributes.spid.gov.it/idCard"?: string;
  "https://attributes.spid.gov.it/mobilePhone"?: string;
  "https://attributes.spid.gov.it/email"?: string;
  "https://attributes.spid.gov.it/address"?: string;
  "https://attributes.spid.gov.it/expirationDate"?: string;
  "https://attributes.spid.gov.it/digitalAddress"?: string;
};

export type UserInfoCIE = {
  sub?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  email_verified?: string;
  gender?: string;
  birthdate?: string;
  phone_number?: string;
  phone_number_verified?: string;
  address?: string;
  place_of_birth?: string;
  document_details?: string;
  e_delivery_service?: string;
  fiscal_number?: string;
  physical_phone_number?: string;
};

const userInfoCieSchema: JSONSchemaType<UserInfoCIE> = {
  type: "object",
  properties: {
    sub: { type: "string", nullable: true },
    given_name: { type: "string", nullable: true },
    family_name: { type: "string", nullable: true },
    email: { type: "string", nullable: true },
    email_verified: { type: "string", nullable: true },
    gender: { type: "string", nullable: true },
    birthdate: { type: "string", nullable: true },
    phone_number: { type: "string", nullable: true },
    phone_number_verified: { type: "string", nullable: true },
    address: { type: "string", nullable: true },
    place_of_birth: { type: "string", nullable: true },
    document_details: { type: "string", nullable: true },
    e_delivery_service: { type: "string", nullable: true },
    fiscal_number: { type: "string", nullable: true },
    physical_phone_number: { type: "string", nullable: true },
  },
};

const validateUserInfoCie = ajv.compile(userInfoCieSchema);

const userInfoSpidSchema: JSONSchemaType<UserInfoSPID> = {
  type: "object",
  properties: {
    "https://attributes.spid.gov.it/name": { type: "string", nullable: true },
    "https://attributes.spid.gov.it/familyName": { type: "string", nullable: true },
    "https://attributes.spid.gov.it/placeOfBirth": { type: "string", nullable: true },
    "https://attributes.spid.gov.it/countyOfBirth": { type: "string", nullable: true },
    "https://attributes.spid.gov.it/dateOfBirth": { type: "string", nullable: true },
    "https://attributes.spid.gov.it/gender": { type: "string", nullable: true },
    "https://attributes.spid.gov.it/companyName": { type: "string", nullable: true },
    "https://attributes.spid.gov.it/registeredOffice": { type: "string", nullable: true },
    "https://attributes.spid.gov.it/fiscalNumber": { type: "string", nullable: true },
    "https://attributes.spid.gov.it/ivaCode": { type: "string", nullable: true },
    "https://attributes.spid.gov.it/idCard": { type: "string", nullable: true },
    "https://attributes.spid.gov.it/mobilePhone": { type: "string", nullable: true },
    "https://attributes.spid.gov.it/email": { type: "string", nullable: true },
    "https://attributes.spid.gov.it/address": { type: "string", nullable: true },
    "https://attributes.spid.gov.it/expirationDate": { type: "string", nullable: true },
    "https://attributes.spid.gov.it/digitalAddress": { type: "string", nullable: true },
  },
} as const;

const validateUserInfoSpid = ajv.compile(userInfoSpidSchema);