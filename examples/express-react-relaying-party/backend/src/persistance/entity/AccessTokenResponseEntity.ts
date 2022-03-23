import {
  Entity,
  Column,
  ManyToOne,
  UpdateDateColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AuthenticationRequestEntity } from "./AuthenticationRequestEntity";

@Entity()
export class AccessTokenResponseEntity {
  @PrimaryGeneratedColumn()
  id: number;
  @ManyToOne(() => AuthenticationRequestEntity)
  authentication_request: AuthenticationRequestEntity;
  /** retrieved using deriveUserIdentifier() */
  @Column()
  user_identifier: string;
  /** retrieved from provider */
  @Column()
  id_token: string;
  @Column()
  access_token: string;
  @Column()
  revoked: boolean;
  @CreateDateColumn()
  created: Date;
  @UpdateDateColumn()
  updated: Date;
}
