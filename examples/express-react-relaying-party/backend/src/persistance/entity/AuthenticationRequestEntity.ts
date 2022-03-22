import { Entity, Column, PrimaryColumn } from "typeorm";
import * as jose from "jose";

@Entity()
export class AuthenticationRequestEntity {
  @PrimaryColumn()
  state: string;
  @Column()
  redirect_uri: string;
  @Column()
  code_verifier: string;
  @Column()
  token_endpoint: string;
  @Column()
  userinfo_endpoint: string;
  @Column("simple-json")
  provider_jwks: { keys: Array<jose.JWK> };
}
