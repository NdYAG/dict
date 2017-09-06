# dict

[AnkiMobile now supports adding note through URL scheme](https://apps.ankiweb.net/docs/am-manual.html#url-schemes), which makes it possible to add words to Anki with the help of [Workflow iOS](https://workflow.is/) with much ease.

Basically the flow runs in this way:

![](http://7d9o0k.com1.z0.glb.clouddn.com/dict.jpg)

_Select a word while you are reading on iOS device -> Share -> Run Workflow -> Get word pronunciation and definition using this API -> Save to Anki_

[You can get this workflow here](https://workflow.is/workflows/6a9aa8f662c54ade9c43b7752f3c42b1), then deploy your own dictionary service and alter the Anki x-callback scheme based on your own profile/deck/field.

Behind dict is [mw-dict](https://github.com/NdYAG/mw-dict), which serializes word definition into a developer-friendly and readable json format from Merriam Webster's Developer API.

## start

```shell
yarn
cp config.sample.js config.js # insert your API key from dictionaryapi.com
node index.js --port=3001
```