import { Entity, Column, PrimaryColumn, CreateDateColumn } from "typeorm";
import * as jose from "jose";

@Entity()
export class AuthenticationRequestEntity {
  /** authentication reqest unique identifier (generated radnomly by relying party) */
  @PrimaryColumn()
  state: string;
  /** generated randomly by relying party */
  @Column()
  code_verifier: string;
  /** got from relying party configuration */
  @Column()
  redirect_uri: string;
  /** got from provider configuration */
  @Column()
  token_endpoint: string;
  /** got from provider configuration */
  @Column()
  userinfo_endpoint: string;
  /** got from provider configuration */
  @Column()
  revocation_endpoint: string;
  /** got from provider configuration */
  @Column("simple-json")
  provider_jwks: { keys: Array<jose.JWK> };
  @CreateDateColumn()
  created: Date;
}
