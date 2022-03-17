// TODO better docs

this project showcases the relaying party

run the example project `federation` from  https://github.com/italia/spid-cie-oidc-django

- register here http://127.0.0.1:8000/onboarding/registration/
  - paste in the federation related jwks
- do the same here  http://127.0.0.1:8000/admin/spid_cie_oidc_authority/federationdescendant/1/change/
  - copy trust_marks from here to your relaying party configuration

// puoi creare jwk su http://127.0.0.1:8000/onboarding/tools/create-jwk/