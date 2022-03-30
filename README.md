# SPID/CIE OIDC Federation, for Node.js

[![Get invited](https://slack.developers.italia.it/badge.svg)](https://slack.developers.italia.it/)
[![Join the #spid openid](https://img.shields.io/badge/Slack%20channel-%23spid%20openid-blue.svg)](https://developersitalia.slack.com/archives/C7E85ED1N/)

> ⚠️ This project is a WiP


The SPID/CIE OIDC Federation, for in Node.js

![preview](preview.gif)

## Packages

- [relying party](relying-party/README.md)

## Example projects

- [express + react](examples/express-react-relaying-party/README.md)

## Useful links

* [Openid Connect Federation](https://openid.net/specs/openid-connect-federation-1_0.html)
* [SPID/CIE OIDC Federation SDK](https://github.com/italia/spid-cie-oidc-django)


## Contribute

Your contribution is welcome, no question is useless and no answer is obvious, we need you.

#### Contribute as end user

Please open an issue if you've discoveerd a bug or if you want to ask some features.


## License and Authors

This software is released under the Apache 2 License by:

- Frederik Batuna <frederik.batuna@smc.it>.

## Notes for mantainers

There are these remainders as comments or identifier prefixes:

- TODO -> planned for a milestone
- REPLACEME -> to be implemented
- SHOULDDO -> delayable until needed

### Npm package publishing

A [github action](https://github.com/features/actions) is configured [here](.github\workflows\npm-publish.yml) to publish the package automatically.

To publish a new version of the package create a new release [here](https://github.com/italia/spid-cie-oidc-nodejs/releases/new).

To change npmjs secret ([article](https://dev.to/astagi/publish-to-npm-using-github-actions-23fn)).
