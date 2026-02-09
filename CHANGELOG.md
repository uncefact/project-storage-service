# Changelog

## [1.0.1](https://github.com/uncefact/project-storage-service/compare/3.0.1...1.0.1) (2026-02-09)


### ⚠ BREAKING CHANGES

* **routes:** consolidate API endpoints into /public and /private ([#83](https://github.com/uncefact/project-storage-service/issues/83))
* **storage:** add support for S3-compatible storage providers ([#49](https://github.com/uncefact/project-storage-service/issues/49))

### Features

* Add authentication layer ([#30](https://github.com/uncefact/project-storage-service/issues/30)) ([cebe460](https://github.com/uncefact/project-storage-service/commit/cebe460e966580e62746e3254a8ace02c97c67d3))
* Add digital ocean storage ([#23](https://github.com/uncefact/project-storage-service/issues/23)) ([73d130a](https://github.com/uncefact/project-storage-service/commit/73d130aad13b8c6d844c27678f193f74be599049))
* **ci:** Add Docker image workflow for next branch ([#68](https://github.com/uncefact/project-storage-service/issues/68)) ([e0a148c](https://github.com/uncefact/project-storage-service/commit/e0a148c290208517f5e15df616ddc909a6349f26))
* **config:** Add EXTERNAL_PORT to decouple server port from URL generation ([#69](https://github.com/uncefact/project-storage-service/issues/69)) ([725de2e](https://github.com/uncefact/project-storage-service/commit/725de2e9a41f11a654b4f4bc10369cd2ffd256c9))
* Configure automated changelog generation ([#12](https://github.com/uncefact/project-storage-service/issues/12)) ([5354b57](https://github.com/uncefact/project-storage-service/commit/5354b57907ff2f81d5db24e754597cf18d874db1))
* **crypto:** Delegate cryptography to @uncefact/untp-ri-services ([4150779](https://github.com/uncefact/project-storage-service/commit/41507790d253397e865d351d428e26a41c1498cb))
* **files:** Add binary file upload support ([#74](https://github.com/uncefact/project-storage-service/issues/74)) ([4032fc1](https://github.com/uncefact/project-storage-service/commit/4032fc1ae17e7177efc7e5d7cdd36e804572ab3c))
* Implement AWS S3 storage adapter ([#8](https://github.com/uncefact/project-storage-service/issues/8)) ([e87d4fc](https://github.com/uncefact/project-storage-service/commit/e87d4fc2daff566962131cc092067ceb9e8bfbca))
* Implement local storage service ([#2](https://github.com/uncefact/project-storage-service/issues/2)) ([a3e5f65](https://github.com/uncefact/project-storage-service/commit/a3e5f65441bd686733e01177c03626bfc01c09d4))
* Implement storage api for document ([3d9a245](https://github.com/uncefact/project-storage-service/commit/3d9a2455ea96e07cd5288344733112c7206a0817))
* **routes:** Consolidate API endpoints into /public and /private ([#83](https://github.com/uncefact/project-storage-service/issues/83)) ([16aedba](https://github.com/uncefact/project-storage-service/commit/16aedba24b6bca92224ff67b33413dbe142bd5a5))
* **storage:** Add support for S3-compatible storage providers ([#49](https://github.com/uncefact/project-storage-service/issues/49)) ([f17613b](https://github.com/uncefact/project-storage-service/commit/f17613b2c573b572664629cca700acfb5b16b0f4))


### Bug Fixes

* **ci:** Disable v prefix in release-please tag generation ([#65](https://github.com/uncefact/project-storage-service/issues/65)) ([5cf1f52](https://github.com/uncefact/project-storage-service/commit/5cf1f52efc5a67feb2689e8e38901a060468b15e))
* **ci:** Disable v prefix in release-please tag generation ([#65](https://github.com/uncefact/project-storage-service/issues/65)) ([abed7e0](https://github.com/uncefact/project-storage-service/commit/abed7e05c1479d2e5552a6e6bd5520619a87863e))
* **ci:** Downgrade lint-staged to v15 for node 18 compatibility ([b7f05bd](https://github.com/uncefact/project-storage-service/commit/b7f05bdaeddd432925b2aa6ef0d9eaededf94598))
* **ci:** Improve release and package workflow reliability ([#50](https://github.com/uncefact/project-storage-service/issues/50)) ([ecfa519](https://github.com/uncefact/project-storage-service/commit/ecfa519f1d8459140e825b4d28579f0139c29135))
* **ci:** Use correct lint script name in release workflow ([3d3da85](https://github.com/uncefact/project-storage-service/commit/3d3da852305e38ec646d2abec60b9e0f022385e9))
* **docs:** Add missing code block in installation docs ([719b56a](https://github.com/uncefact/project-storage-service/commit/719b56a550a437f5ecf0f68b9a23b1359c3dc9ff))
* **docs:** Add missing code block in installation docs ([13ba6b4](https://github.com/uncefact/project-storage-service/commit/13ba6b4058ea078352458a77e06dfeef2aba7282))
* **docs:** Improve 409 and 500 swagger response descriptions ([23f031f](https://github.com/uncefact/project-storage-service/commit/23f031fac2e09b80075cfec0dcc8ae13b4df227e))
* **docs:** Remove incorrect v prefix from changelog compare links ([d6d5deb](https://github.com/uncefact/project-storage-service/commit/d6d5deb137a4a5c04d51ef3feabc2480f69fd2a9))
* Dotenv loading order and objectExists key handling ([#76](https://github.com/uncefact/project-storage-service/issues/76)) ([c321f3a](https://github.com/uncefact/project-storage-service/commit/c321f3af08ccee82f01238fca4716cbd2c4ec153))
* Handle trigger package workflow ([#21](https://github.com/uncefact/project-storage-service/issues/21)) ([403c205](https://github.com/uncefact/project-storage-service/commit/403c205e61433e0e1fd54b8046f4838cb88d745a))
* **swagger:** Use config values for Swagger UI server URL ([#62](https://github.com/uncefact/project-storage-service/issues/62)) ([93b5084](https://github.com/uncefact/project-storage-service/commit/93b5084280ca8415741a59fe82b17f323b1c37d4))


### Code Refactoring

* **tests:** Read API version from version.json instead of hardcoding ([#75](https://github.com/uncefact/project-storage-service/issues/75)) ([45177c9](https://github.com/uncefact/project-storage-service/commit/45177c920419e515f5514391f9032d5916ae38a4))
* Update limit of payload ([40264dd](https://github.com/uncefact/project-storage-service/commit/40264dd369b9838746ada50a0cc782e2db37afc6))
* Update limit of payload ([61ccb3e](https://github.com/uncefact/project-storage-service/commit/61ccb3e32e4db665a7c7b471bb1b7a8cc97331bb))


### Tests

* **e2e:** Replace mocked E2E tests with real S3-compatible storage ([#84](https://github.com/uncefact/project-storage-service/issues/84)) ([342695a](https://github.com/uncefact/project-storage-service/commit/342695ae785ade26fed295df584121e50a807ea2))


### Documentation

* Add migration guide for 2.x to 3.0.0 upgrade ([2a51065](https://github.com/uncefact/project-storage-service/commit/2a510656ea3ca7e645b03540cddf60df865ab917))
* Add migration guide to documentation site ([2c46b33](https://github.com/uncefact/project-storage-service/commit/2c46b33479f553c65196ca082d33201cdb7d8aa3))
* Add project-release skill capturing release process learnings ([52f8603](https://github.com/uncefact/project-storage-service/commit/52f8603f7e1e267b25c32f97c19245284990d438))
* Add release guide ([#15](https://github.com/uncefact/project-storage-service/issues/15)) ([9b2e12d](https://github.com/uncefact/project-storage-service/commit/9b2e12d68fb614da61378252058477f0f694baaa))
* Add release management guide ([#20](https://github.com/uncefact/project-storage-service/issues/20)) ([6b3d3b0](https://github.com/uncefact/project-storage-service/commit/6b3d3b05d963be4cda82507ee37f933d0815928d))
* Add swagger spec ([#6](https://github.com/uncefact/project-storage-service/issues/6)) ([48bd8aa](https://github.com/uncefact/project-storage-service/commit/48bd8aaba8af89b229fae795da3a46c0e6d89f98))
* Fix S3-compatible storage documentation ([8cd6007](https://github.com/uncefact/project-storage-service/commit/8cd60077267c93c8727ed89d5565bf4ae81b835f))
* Implement versioning documentation ([#10](https://github.com/uncefact/project-storage-service/issues/10)) ([3ef6fc5](https://github.com/uncefact/project-storage-service/commit/3ef6fc52ef6ac944f701f7cd791ede38694304db))
* Init documentation site with Docusaurus setup ([#9](https://github.com/uncefact/project-storage-service/issues/9)) ([70abc69](https://github.com/uncefact/project-storage-service/commit/70abc698c090d51e2c59c7cb2d47bcc0f080fa75))
* Overhaul documentation with public and private data framing ([#88](https://github.com/uncefact/project-storage-service/issues/88)) ([35e10cb](https://github.com/uncefact/project-storage-service/commit/35e10cbdcc97759312c8581deb158bd9f10fba0f))
* **readme:** Clarify storage endpoint differences ([#35](https://github.com/uncefact/project-storage-service/issues/35)) ([22d311c](https://github.com/uncefact/project-storage-service/commit/22d311c8dd80722c62d3edac09215dc9b0e68345))
* Replace navbar logo with UNTP branding and remove disclaimer banners ([1306f63](https://github.com/uncefact/project-storage-service/commit/1306f6350c4ba1196ef2cd9a2ad4cc4f484ae352))
* **site:** Add storage options guide for public vs private data ([#37](https://github.com/uncefact/project-storage-service/issues/37)) ([d643097](https://github.com/uncefact/project-storage-service/commit/d6430975da4b3ecbbe655310464300bd13eaaecb))
* **swagger:** Clarify endpoint encryption behavior ([#36](https://github.com/uncefact/project-storage-service/issues/36)) ([1828d52](https://github.com/uncefact/project-storage-service/commit/1828d52697255e95a6092f303711f13580afb243))
* **swagger:** Use generic public/private data terminology ([#39](https://github.com/uncefact/project-storage-service/issues/39)) ([e24cec2](https://github.com/uncefact/project-storage-service/commit/e24cec2dca8b45843c1019c6272c87deaa1bc0fa))
* Use generic public/private data terminology ([#38](https://github.com/uncefact/project-storage-service/issues/38)) ([568cfd1](https://github.com/uncefact/project-storage-service/commit/568cfd1e9a5b8e91ec309cfcc1107bdbf5f22315))


### Miscellaneous

* Release 1.0.0 ([9544044](https://github.com/uncefact/project-storage-service/commit/954404413f5e8d663d4cf50861ab070d88337555))
* Release 1.0.1 ([534a8c9](https://github.com/uncefact/project-storage-service/commit/534a8c90c38daea49ee26da65c11ec57e5797e9a))


### CI

* Add multi-arch Docker image support and version tagging ([#43](https://github.com/uncefact/project-storage-service/issues/43)) ([08d9b97](https://github.com/uncefact/project-storage-service/commit/08d9b97be35f0a3dade27303587ceb75469422f0))
* Enable domain mapping ([#2](https://github.com/uncefact/project-storage-service/issues/2)) ([75806f4](https://github.com/uncefact/project-storage-service/commit/75806f461ca3acb3035afc80992fd59cc86f6954))
* Push docker image ([#2](https://github.com/uncefact/project-storage-service/issues/2)) ([8aed15c](https://github.com/uncefact/project-storage-service/commit/8aed15c29440fb2081a6ad0c6341e2786d4ce9da))

## [3.0.1](https://github.com/uncefact/project-storage-service/compare/3.0.0...3.0.1) (2026-02-09)


### Bug Fixes

* **ci:** Use correct lint script name in release workflow ([3d3da85](https://github.com/uncefact/project-storage-service/commit/3d3da85))

## [3.0.0](https://github.com/uncefact/project-storage-service/compare/2.2.0...3.0.0) (2026-02-09)


### ⚠ BREAKING CHANGES

* **routes:** consolidate API endpoints into /public and /private ([#83](https://github.com/uncefact/project-storage-service/issues/83))

### Features

* **crypto:** Delegate cryptography to @uncefact/untp-ri-services ([4150779](https://github.com/uncefact/project-storage-service/commit/41507790d253397e865d351d428e26a41c1498cb))
* **routes:** Consolidate API endpoints into /public and /private ([#83](https://github.com/uncefact/project-storage-service/issues/83)) ([16aedba](https://github.com/uncefact/project-storage-service/commit/16aedba24b6bca92224ff67b33413dbe142bd5a5))


### Bug Fixes

* **ci:** Downgrade lint-staged to v15 for node 18 compatibility ([b7f05bd](https://github.com/uncefact/project-storage-service/commit/b7f05bdaeddd432925b2aa6ef0d9eaededf94598))
* **docs:** Improve 409 and 500 swagger response descriptions ([23f031f](https://github.com/uncefact/project-storage-service/commit/23f031fac2e09b80075cfec0dcc8ae13b4df227e))


### Tests

* **e2e:** Replace mocked E2E tests with real S3-compatible storage ([#84](https://github.com/uncefact/project-storage-service/issues/84)) ([342695a](https://github.com/uncefact/project-storage-service/commit/342695ae785ade26fed295df584121e50a807ea2))


### Documentation

* Add migration guide for 2.x to 3.0.0 upgrade ([2a51065](https://github.com/uncefact/project-storage-service/commit/2a510656ea3ca7e645b03540cddf60df865ab917))
* Overhaul documentation with public and private data framing ([#88](https://github.com/uncefact/project-storage-service/issues/88)) ([35e10cb](https://github.com/uncefact/project-storage-service/commit/35e10cbdcc97759312c8581deb158bd9f10fba0f))
* Replace navbar logo with UNTP branding and remove disclaimer banners ([1306f63](https://github.com/uncefact/project-storage-service/commit/1306f6350c4ba1196ef2cd9a2ad4cc4f484ae352))

## [2.2.0](https://github.com/uncefact/project-identity-resolver/compare/2.1.0...2.2.0) (2026-02-07)


### Features

* **files:** Add binary file upload support ([#74](https://github.com/uncefact/project-identity-resolver/issues/74)) ([4032fc1](https://github.com/uncefact/project-identity-resolver/commit/4032fc1ae17e7177efc7e5d7cdd36e804572ab3c))


### Bug Fixes

* Dotenv loading order and objectExists key handling ([#76](https://github.com/uncefact/project-identity-resolver/issues/76)) ([c321f3a](https://github.com/uncefact/project-identity-resolver/commit/c321f3af08ccee82f01238fca4716cbd2c4ec153))


### Code Refactoring

* **tests:** Read API version from version.json instead of hardcoding ([#75](https://github.com/uncefact/project-identity-resolver/issues/75)) ([45177c9](https://github.com/uncefact/project-identity-resolver/commit/45177c920419e515f5514391f9032d5916ae38a4))

## [2.1.0](https://github.com/uncefact/project-identity-resolver/compare/2.0.3...2.1.0) (2026-02-05)


### Features

* **ci:** Add Docker image workflow for next branch ([#68](https://github.com/uncefact/project-identity-resolver/issues/68)) ([e0a148c](https://github.com/uncefact/project-identity-resolver/commit/e0a148c290208517f5e15df616ddc909a6349f26))
* **config:** Add EXTERNAL_PORT to decouple server port from URL generation ([#69](https://github.com/uncefact/project-identity-resolver/issues/69)) ([725de2e](https://github.com/uncefact/project-identity-resolver/commit/725de2e9a41f11a654b4f4bc10369cd2ffd256c9))


### Bug Fixes

* **ci:** Disable v prefix in release-please tag generation ([#65](https://github.com/uncefact/project-identity-resolver/issues/65)) ([abed7e0](https://github.com/uncefact/project-identity-resolver/commit/abed7e05c1479d2e5552a6e6bd5520619a87863e))

## [2.0.3](https://github.com/uncefact/project-identity-resolver/compare/2.0.2...2.0.3) (2026-02-04)


### Bug Fixes

* **swagger:** Use config values for Swagger UI server URL ([#62](https://github.com/uncefact/project-identity-resolver/issues/62)) ([93b5084](https://github.com/uncefact/project-identity-resolver/commit/93b5084280ca8415741a59fe82b17f323b1c37d4))

## [2.0.2](https://github.com/uncefact/project-identity-resolver/compare/2.0.1...2.0.2) (2026-02-03)


### Bug Fixes

* **docs:** Add missing code block in installation docs ([13ba6b4](https://github.com/uncefact/project-identity-resolver/commit/13ba6b4058ea078352458a77e06dfeef2aba7282))

## [2.0.1](https://github.com/uncefact/project-identity-resolver/compare/2.0.0...2.0.1) (2026-02-03)


### Documentation

* Fix S3-compatible storage documentation ([8cd6007](https://github.com/uncefact/project-identity-resolver/commit/8cd60077267c93c8727ed89d5565bf4ae81b835f))

## [2.0.0](https://github.com/uncefact/project-identity-resolver/compare/1.1.1...2.0.0) (2026-02-03)


### ⚠ BREAKING CHANGES

* **storage:** add support for S3-compatible storage providers ([#49](https://github.com/uncefact/project-identity-resolver/issues/49))

### Features

* **storage:** Add support for S3-compatible storage providers ([#49](https://github.com/uncefact/project-identity-resolver/issues/49)) ([f17613b](https://github.com/uncefact/project-identity-resolver/commit/f17613b2c573b572664629cca700acfb5b16b0f4))


### Bug Fixes

* **ci:** Improve release and package workflow reliability ([#50](https://github.com/uncefact/project-identity-resolver/issues/50)) ([ecfa519](https://github.com/uncefact/project-identity-resolver/commit/ecfa519f1d8459140e825b4d28579f0139c29135))

## [1.1.1](https://github.com/uncefact/project-identity-resolver/compare/1.1.0...1.1.1) (2026-01-29)


### Miscellaneous

* Update version.json and generate docs for 1.1.1 ([2b086f4](https://github.com/uncefact/project-identity-resolver/commit/2b086f430dac6051d0aca05f9ddbc476441d0a19))


### CI

* Add multi-arch Docker image support and version tagging ([#43](https://github.com/uncefact/project-identity-resolver/issues/43)) ([08d9b97](https://github.com/uncefact/project-identity-resolver/commit/08d9b97be35f0a3dade27303587ceb75469422f0))

## [1.1.0](https://github.com/uncefact/project-identity-resolver/compare/1.0.1...1.1.0) (2026-01-21)


### Features

* Add authentication layer ([#30](https://github.com/uncefact/project-identity-resolver/issues/30)) ([cebe460](https://github.com/uncefact/project-identity-resolver/commit/cebe460e966580e62746e3254a8ace02c97c67d3))
* Add digital ocean storage ([#23](https://github.com/uncefact/project-identity-resolver/issues/23)) ([73d130a](https://github.com/uncefact/project-identity-resolver/commit/73d130aad13b8c6d844c27678f193f74be599049))


### Bug Fixes

* Handle trigger package workflow ([#21](https://github.com/uncefact/project-identity-resolver/issues/21)) ([403c205](https://github.com/uncefact/project-identity-resolver/commit/403c205e61433e0e1fd54b8046f4838cb88d745a))


### Documentation

* Add release management guide ([#20](https://github.com/uncefact/project-identity-resolver/issues/20)) ([6b3d3b0](https://github.com/uncefact/project-identity-resolver/commit/6b3d3b05d963be4cda82507ee37f933d0815928d))
* **readme:** Clarify storage endpoint differences ([#35](https://github.com/uncefact/project-identity-resolver/issues/35)) ([22d311c](https://github.com/uncefact/project-identity-resolver/commit/22d311c8dd80722c62d3edac09215dc9b0e68345))
* **site:** Add storage options guide for public vs private data ([#37](https://github.com/uncefact/project-identity-resolver/issues/37)) ([d643097](https://github.com/uncefact/project-identity-resolver/commit/d6430975da4b3ecbbe655310464300bd13eaaecb))
* **swagger:** Clarify endpoint encryption behavior ([#36](https://github.com/uncefact/project-identity-resolver/issues/36)) ([1828d52](https://github.com/uncefact/project-identity-resolver/commit/1828d52697255e95a6092f303711f13580afb243))
* **swagger:** Use generic public/private data terminology ([#39](https://github.com/uncefact/project-identity-resolver/issues/39)) ([e24cec2](https://github.com/uncefact/project-identity-resolver/commit/e24cec2dca8b45843c1019c6272c87deaa1bc0fa))
* Use generic public/private data terminology ([#38](https://github.com/uncefact/project-identity-resolver/issues/38)) ([568cfd1](https://github.com/uncefact/project-identity-resolver/commit/568cfd1e9a5b8e91ec309cfcc1107bdbf5f22315))


### Miscellaneous

* **release:** Bump version to 1.1.0 ([0ed515c](https://github.com/uncefact/project-identity-resolver/commit/0ed515c57285387e31d5e2785ddb408d94518d22))
* Reset version to 1.0.1 for release-please ([39ec604](https://github.com/uncefact/project-identity-resolver/commit/39ec60490eace12496825bacd707ced33f540e69))
* Update release-please workflow and config ([333223e](https://github.com/uncefact/project-identity-resolver/commit/333223e2d8da7f4b2ee44e419b4582f83c5544db))

## [1.0.1](https://github.com/uncefact/project-identity-resolver/compare/1.0.0...1.0.1) (2025-01-03)


### Miscellaneous

* Release 1.0.1 ([534a8c9](https://github.com/uncefact/project-identity-resolver/commit/534a8c90c38daea49ee26da65c11ec57e5797e9a))
* Update script ([389f598](https://github.com/uncefact/project-identity-resolver/commit/389f59855b8047adfccec61155e7621199974678))
* Update version for hotfix ([20f6272](https://github.com/uncefact/project-identity-resolver/commit/20f62722e9635336731057e079e11f4cd12cc400))

## [1.0.0](https://github.com/uncefact/project-identity-resolver/compare/1.0.0...1.0.0) (2025-01-03)


### Features

* Configure automated changelog generation ([#12](https://github.com/uncefact/project-identity-resolver/issues/12)) ([5354b57](https://github.com/uncefact/project-identity-resolver/commit/5354b57907ff2f81d5db24e754597cf18d874db1))
* Implement AWS S3 storage adapter ([#8](https://github.com/uncefact/project-identity-resolver/issues/8)) ([e87d4fc](https://github.com/uncefact/project-identity-resolver/commit/e87d4fc2daff566962131cc092067ceb9e8bfbca))
* Implement local storage service ([#2](https://github.com/uncefact/project-identity-resolver/issues/2)) ([a3e5f65](https://github.com/uncefact/project-identity-resolver/commit/a3e5f65441bd686733e01177c03626bfc01c09d4))
* Implement storage api for document ([3d9a245](https://github.com/uncefact/project-identity-resolver/commit/3d9a2455ea96e07cd5288344733112c7206a0817))


### Code Refactoring

* Update limit of payload ([61ccb3e](https://github.com/uncefact/project-identity-resolver/commit/61ccb3e32e4db665a7c7b471bb1b7a8cc97331bb))


### Documentation

* Add release guide ([#15](https://github.com/uncefact/project-identity-resolver/issues/15)) ([9b2e12d](https://github.com/uncefact/project-identity-resolver/commit/9b2e12d68fb614da61378252058477f0f694baaa))
* Add swagger spec ([#6](https://github.com/uncefact/project-identity-resolver/issues/6)) ([48bd8aa](https://github.com/uncefact/project-identity-resolver/commit/48bd8aaba8af89b229fae795da3a46c0e6d89f98))
* Implement versioning documentation ([#10](https://github.com/uncefact/project-identity-resolver/issues/10)) ([3ef6fc5](https://github.com/uncefact/project-identity-resolver/commit/3ef6fc52ef6ac944f701f7cd791ede38694304db))
* Init documentation site with Docusaurus setup ([#9](https://github.com/uncefact/project-identity-resolver/issues/9)) ([70abc69](https://github.com/uncefact/project-identity-resolver/commit/70abc698c090d51e2c59c7cb2d47bcc0f080fa75))


### Miscellaneous

* Add test and build workflows ([#14](https://github.com/uncefact/project-identity-resolver/issues/14)) ([f5f751a](https://github.com/uncefact/project-identity-resolver/commit/f5f751a22799512ce0a948bc3a573997b3a9031d))
* Implement the Publish Tag workflow ([#11](https://github.com/uncefact/project-identity-resolver/issues/11)) ([6ec4aa8](https://github.com/uncefact/project-identity-resolver/commit/6ec4aa8e13f1ed3022fa6af56e54928563ff726f))
* Init repo ([4347d47](https://github.com/uncefact/project-identity-resolver/commit/4347d472c6c938a967459da01e41c4d4d390b9b0))
* Release 1.0.0 ([9544044](https://github.com/uncefact/project-identity-resolver/commit/954404413f5e8d663d4cf50861ab070d88337555))
