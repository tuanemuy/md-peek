# [1.3.0](https://github.com/tuanemuy/markdown-peek/compare/v1.2.1...v1.3.0) (2026-03-02)


### Features

* replace hardcoded colors with CSS variables ([1f39999](https://github.com/tuanemuy/markdown-peek/commit/1f3999930425501c9fb35c2a5e31c6a8c80b9680))

## [1.2.1](https://github.com/tuanemuy/markdown-peek/compare/v1.2.0...v1.2.1) (2026-03-02)


### Bug Fixes

* fix test and lint issues from dependency upgrades ([4f27439](https://github.com/tuanemuy/markdown-peek/commit/4f27439213f69c56526d99918040854c03c031ad))
* remove unintended content.css changes from PR ([cd87f9d](https://github.com/tuanemuy/markdown-peek/commit/cd87f9d6b750bd9a0a089e458dadf664723361c6))


### Reverts

* restore duplicate background-color in content.css ([94f416a](https://github.com/tuanemuy/markdown-peek/commit/94f416abc7ac51ebc665b130991d90ae3fdd2357))

# [1.2.0](https://github.com/tuanemuy/markdown-peek/compare/v1.1.2...v1.2.0) (2026-03-02)


### Features

* change code highlight theme from gruvbox to vitesse ([39942b1](https://github.com/tuanemuy/markdown-peek/commit/39942b1e9a11e29e753a4434f079e8f16a50e8a1))

## [1.1.2](https://github.com/tuanemuy/markdown-peek/compare/v1.1.1...v1.1.2) (2026-03-02)


### Bug Fixes

* move shebang banner to outputOptions for tsdown compatibility ([60650bf](https://github.com/tuanemuy/markdown-peek/commit/60650bfb0e4da009b530448ec87c1db49fbb11af))

# [1.1.0](https://github.com/tuanemuy/markdown-peek/compare/v1.0.4...v1.1.0) (2026-03-02)


### Bug Fixes

* prevent race condition and partial state in initMarkdown ([d9ca2f3](https://github.com/tuanemuy/markdown-peek/commit/d9ca2f356bcc09ab9492ac9d18aac2018a42e188))


### Features

* add syntax highlighting with Shiki via markdown-it ([95cd652](https://github.com/tuanemuy/markdown-peek/commit/95cd652ae553588aae32430230db45c2a908c824))
* expand supported languages to 50 with categorized list ([6f63d3c](https://github.com/tuanemuy/markdown-peek/commit/6f63d3cfc1e0df0f59a7a8a4b5847b3d8bd2aad5))
* load all bundled languages instead of a fixed subset ([1e880b2](https://github.com/tuanemuy/markdown-peek/commit/1e880b208a3d8e337d3d8b529a518b6e83c76247))

## [1.0.4](https://github.com/tuanemuy/markdown-peek/compare/v1.0.3...v1.0.4) (2026-03-02)


### Bug Fixes

* change CI trigger from push to pull_request on main ([a4cebe1](https://github.com/tuanemuy/markdown-peek/commit/a4cebe1b875f85c73694598e3b9fcebc6a310653))
* change release workflow trigger from workflow_run to push ([03333d6](https://github.com/tuanemuy/markdown-peek/commit/03333d66596b889d71a3d04f4878b862745b63ba))
* remove stale workflow_run condition from release workflow ([fd8baaf](https://github.com/tuanemuy/markdown-peek/commit/fd8baaf189ad28798a6e6182fdc7e9f520cddeb5))

## [1.0.3](https://github.com/tuanemuy/markdown-peek/compare/v1.0.2...v1.0.3) (2026-03-02)


### Bug Fixes

* remove leading ./ from bin path in package.json ([b951c93](https://github.com/tuanemuy/markdown-peek/commit/b951c93dadff39cc51408cc336532e111a264360))

## [1.0.2](https://github.com/tuanemuy/markdown-peek/compare/v1.0.1...v1.0.2) (2026-03-02)


### Bug Fixes

* add build step to release workflow before npm publish ([e4865b0](https://github.com/tuanemuy/markdown-peek/commit/e4865b0062b3abf0b10b0ab27c467ce531dd2a0d))

## [1.0.1](https://github.com/tuanemuy/markdown-peek/compare/v1.0.0...v1.0.1) (2026-03-02)


### Bug Fixes

* improve atomicity and type safety in DOM updater modules ([589c28e](https://github.com/tuanemuy/markdown-peek/commit/589c28e307f9eac2c008c8d5738684e31cfa536c))

# 1.0.0 (2026-03-02)


### Bug Fixes

* Add aria-hidden to decorative SVG icons in theme toggle example ([0f9eb5c](https://github.com/tuanemuy/markdown-peek/commit/0f9eb5c2c4c36510a298da76cb17e64cbe57ce46))
* Improve error handling in directory routes and style loading ([c52e01e](https://github.com/tuanemuy/markdown-peek/commit/c52e01e6453dd85360e4db30b94fbe765dd0ff41))
* Improve file watcher reliability ([a045ed5](https://github.com/tuanemuy/markdown-peek/commit/a045ed503ff936d3f9a149a7d7fc79dc9326a514))
* improve path validation and error type guard ([a549772](https://github.com/tuanemuy/markdown-peek/commit/a549772d7e13e6d4d9d73b67b0b91f1925b34fcd))


### Features

* add centralized logger utility ([171b974](https://github.com/tuanemuy/markdown-peek/commit/171b974dbd00c4ffee954ea46526f2f714c1737c))
* add CSP nonce support and improve server security ([e7632a4](https://github.com/tuanemuy/markdown-peek/commit/e7632a4db2ba2ec7b9af7bd56d4478bfed25939f))
* add utility functions to Result type ([e8bcbb0](https://github.com/tuanemuy/markdown-peek/commit/e8bcbb0a5bcb0a82021ab7a340cdc9c869f39db8))
* Implement markdown preview CLI with live reload ([d2947ae](https://github.com/tuanemuy/markdown-peek/commit/d2947aeeea40bef3cefc1f01890c015cfc1890de))
* Support .gitignore patterns in file tree scanning ([0a5bfd3](https://github.com/tuanemuy/markdown-peek/commit/0a5bfd3b735d0ff69d4481e2d25c3bcacade178a))
