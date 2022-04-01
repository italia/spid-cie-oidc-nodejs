export { Configuration } from "./configuration";
export { createRelyingParty } from "./createRelyingParty";
export { generateJWKS } from "./utils";
export { UserInfo } from "./requestUserInfo";
export { loadOrCreateJWKSFromFilesystem } from "./default-implementations/loadOrCreateJWKSFromFilesystem";
export { loadTrustMarksFromFilesystem } from "./default-implementations/loadTrustMarksFromFilesystem";
export { createLogRotatingFilesystem } from "./default-implementations/logRotatingFilesystem";
export { createAuditLogRotatingFilesystem } from "./default-implementations/auditLogRotatingFilesystem";
export { deriveFiscalNumberUserIdentifier } from "./default-implementations/deriveFiscalNumberUserIdentifier";
export { noopLogger } from "./default-implementations/noopLogger";
export { consoleLogger } from "./default-implementations/consoleLogger";

// TODO check "configuration.logger" occurences and write more informative logs