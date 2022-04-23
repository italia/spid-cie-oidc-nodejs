# SPID CIE OIDC NodeJS Relying Party Example Project with Express and React

This project showcases the relying party.

## Requirements:

- [python](https://www.python.org/downloads/) 3.x or higher
- [node](https://nodejs.org/en/) 16.x or higher
- [yarn](https://yarnpkg.com/) 1.22.x or higher

## How to run

- run the SPID povider [federation](https://github.com/italia/spid-cie-oidc-django/examples/federation)
  - follow these [instructions](https://github.com/italia/spid-cie-oidc-django/blob/main/docs/SETUP.md)
    - `./manage.py runserver 0.0.0.0:8000`
  - the project should run on [http://127.0.0.1:8000](http://127.0.0.1:8000), keep it running

- run the CIE povider [provider](https://github.com/italia/spid-cie-oidc-django/examples/provider)
  - follow these [instructions](https://github.com/italia/spid-cie-oidc-django/blob/main/docs/SETUP.md)
    - `./manage.py runserver 0.0.0.0:8002`
  - the project should run on [http://127.0.0.1:8002](http://127.0.0.1:8002), keep it running

- cd into relying party directory, your local directory that corresponds to [this](https://github.com/italia/spid-cie-oidc-nodejs/tree/main/relying-party)
  - run this command `yarn build && yarn link`

- cd into this directory, your local directory that corresponds to [this](https://github.com/italia/spid-cie-oidc-nodejs/tree/main/examples/express-react-relying-party)
  - create `public.jwks.json` named file in current directory (you can copy this one [public.jwks.json](https://github.com/italia/spid-cie-oidc-nodejs/blob/main/examples/express-react-relying-party/docker/public.jwks.example.json))
  - create `private.jwks.json` named file in current directory (you can copy this one [private.jwks.json](https://github.com/italia/spid-cie-oidc-nodejs/blob/main/examples/express-react-relying-party/docker/private.jwks.example.json))
  - run this command `yarn link spid-cie-oidc && yarn build && yarn start`
  - this will start the relying party server on [http://127.0.0.1:3000](http://127.0.0.1:3000), keep it running

- do the onboarding process
  - register the relying party [here](http://127.0.0.1:8000/admin/spid_cie_oidc_authority/federationdescendant/add)
    - paste in the federation related public jwks (from the previously created file `public.jwks.json`)
    - set isActive to true
  - create new profile [here](http://127.0.0.1:8000/admin/spid_cie_oidc_authority/federationentityassignedprofile/add/)
    - usually you want a private or public profile as for spec
    - after creation you review the profiles
    - copy trust_marks from here as an array to `trust_marks.json` in this direcotry

- restart relying party (the one running on port 3000)

- visit [http://127.0.0.1:3000](http://127.0.0.1:3000) to try out the application

### Docker

A docker image containing this example can be built a run:
  - `docker-compose up` (this builds the images locally)
    - or alternatively `cd docker && docker-compose up` (this download images from repository)
  - add these entries to your hosts file
```
127.0.0.1 trust-anchor.org
127.0.0.1 relying-party.org
```
  - visit `http://relying-party.org:3000`
