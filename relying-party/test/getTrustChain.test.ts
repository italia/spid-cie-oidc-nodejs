import { applyMetadataPolicy, getEntityConfiguration, getEntityStatement } from "../src/getTrustChain";
import { mockRelyingParty, mockRelyingPartyEntityConfiguration } from "./mocks";

describe("get trust chain", () => {});

describe("get entity statement", () => {
  const descendant = { sub: "" } as any;
  const superior = { metadata: { federation_entity: { federation_fetch_endpoint: "" } } } as any;
  test("it fails on bad response", async () => {
    await expect(
      getEntityStatement(
        {
          ...(await mockRelyingParty.getConfiguration()),
          async httpClient() {
            return { status: 400, headers: {}, body: "" };
          },
        },
        descendant,
        superior
      )
    ).rejects.toThrow(`Expected status 200 but got 400`);
  });
  test("it fails on bad response headers", async () => {
    await expect(
      getEntityStatement(
        {
          ...(await mockRelyingParty.getConfiguration()),
          async httpClient() {
            return {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
              body: "",
            };
          },
        },
        descendant,
        superior
      )
    ).rejects.toThrow(`Expected content-type application/entity-statement+jwt but got application/json`);
  });
});

describe("get entity statement", () => {
  test("it fails on bad response headers", async () => {
    await expect(
      getEntityConfiguration(
        {
          ...(await mockRelyingParty.getConfiguration()),
          async httpClient() {
            return {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
              body: "",
            };
          },
        },
        "",
        (() => true) as any
      )
    ).rejects.toThrow(`Expected content-type application/entity-statement+jwt but got application/json`);
  });
  test("it fails if entity configuration has missing pieces", async () => {
    await expect(
      getEntityConfiguration(
        {
          ...(await mockRelyingParty.getConfiguration()),
          async httpClient() {
            return {
              status: 200,
              headers: {
                "content-type": "application/entity-statement+jwt",
              },
              body: await mockRelyingPartyEntityConfiguration(),
            };
          },
        },
        "",
        (() => false) as any
      )
    ).rejects.toThrow(`Malformed entity configuration`);
  });
});

test("apply metadata policy", () => {
  expect(
    applyMetadataPolicy(
      {
        "relying-party": {
          "field-add": ["a"],
          "field-subset_of": ["a", "d"],
          "field-superset_of": ["a"],
          "field-one_of": "c",
        },
      },
      {
        "relying-party": {
          "field-add": { add: "add" },
          "field-value": { value: "value" },
          "field-default": { default: "default" },
          "field-subset_of": { subset_of: ["a", "b", "c"] },
          "field-superset_of": { superset_of: ["a", "b"] },
          "field-one_of": { one_of: ["a", "b"] },
        },
      }
    )
  ).toEqual({
    "relying-party": {
      "field-add": ["a", "add"],
      "field-value": "value",
      "field-default": "default",
    },
  });
});
