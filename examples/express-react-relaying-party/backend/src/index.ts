import express from "express";
import router from "./oidc-router";
import { REPLACEME_PORT } from "./settings";


const app = express();

app.use(router);

app.listen(REPLACEME_PORT, () => {
  console.log(`Example app listening on port ${REPLACEME_PORT}`);
});
