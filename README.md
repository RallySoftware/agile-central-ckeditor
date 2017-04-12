# agile-central-ckeditor

CkEditor build configured for Sombrero UI library and CA Agile Central.

## Build ckeditor

* `npm install`
* edit `ckeditor-build-config.js`
* `npm run build` or `npm run build-dev` to build an unminified version.

## Skin development

* Open `sample.html` in a browser.
* Modify CSS in `skins/sombrero`.
* Note that default editor content styles are not part of a skin but rather are located in `contents.css`.
* Rebuild and refresh browser to see changes.

## Dev workflow

* Install node modules with `npm install`.
* Run `npm run watch-src` or `npm run watch-src-dev` from the command line to automatically rebuild on file change.
