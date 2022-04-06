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
