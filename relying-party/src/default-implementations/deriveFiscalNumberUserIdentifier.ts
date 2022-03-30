import { UserInfo } from "../UserInfoRequest";

export function deriveFiscalNumberUserIdentifier(user_info: UserInfo) {
  const userIdentifierFields = ["https://attributes.spid.gov.it/fiscalNumber", "fiscalNumber"];
  if (!(typeof user_info === "object" && user_info !== null)) throw new Error();
  const claimsAsRecord = user_info as Record<string, unknown>;
  for (const userIdentifierField of userIdentifierFields) {
    const value = claimsAsRecord[userIdentifierField];
    if (typeof value === "string") return value;
  }
  throw new Error();
}
