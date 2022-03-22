import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class AuthenticationRequestEntity {
  @PrimaryColumn()
  state: string;
  @Column()
  redirect_uri: string;
  @Column()
  code_verifier: string;
  @Column()
  token_endpoint: string
}
