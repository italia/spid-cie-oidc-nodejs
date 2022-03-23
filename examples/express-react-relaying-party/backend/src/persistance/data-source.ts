import "reflect-metadata";
import { DataSource } from "typeorm";
import { AccessTokenResponseEntity } from "./entity/AccessTokenResponseEntity";
import { AuthenticationRequestEntity } from "./entity/AuthenticationRequestEntity";

// TODO make it configurable

export const dataSource = new DataSource({
  type: "sqlite",
  database: "database.sqlite",
  synchronize: true,
  logging: false,
  entities: [AuthenticationRequestEntity, AccessTokenResponseEntity],
  migrations: [],
  subscribers: [],
});
