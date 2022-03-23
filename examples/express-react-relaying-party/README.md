# SPID CIE OIDC NodeJS Relying Party Example Project with Express and React

This project showcases the relaying party.

## Requirements:

- [python](https://www.python.org/downloads/) 3.x or higher
- [node](https://nodejs.org/en/) 16.x or higher
- [yarn](https://yarnpkg.com/) 1.22.x or higher

## How to run

- run the povider [federation](https://github.com/italia/spid-cie-oidc-django)
  - follow these [instructions](https://github.com/italia/spid-cie-oidc-django/blob/main/docs/SETUP.md)
  - the project should run on [http://127.0.0.1:8000](http://127.0.0.1:8000), keep it running

- cd into this directory, your local directory that corresponds to [this](https://github.com/italia/spid-cie-oidc-nodejs/tree/main/examples/express-react-relaying-party)
  - run this command `yarn build && yarn start`
  - this will start the relying party server on [http://127.0.0.1:3000](http://127.0.0.1:3000)

- do the onboarding process
  - register the relying party here (http://127.0.0.1:8000/admin/spid_cie_oidc_authority/federationdescendant/add)
    - paste in the federation related public jwks (you find them [here](backend/src/index.ts))
  - create new profile [here](http://127.0.0.1:8000/admin/spid_cie_oidc_authority/federationentityassignedprofile/add/)
    - usually you want a private or public profile as for spec
    - after creation you review the profiles
    - copy trust_marks from here to your [relaying party configuration](backend/src/index.ts)

- visit [http://127.0.0.1:3000](http://127.0.0.1:3000) to try out the application

- there is a tool for creating jwks [here](http://127.0.0.1:3000/oidc/rp/configuration-helper)