const Koa = require('koa')
const router = require('koa-route')
const ratelimit = require('koa-ratelimit')
const Redis = require('ioredis')
const pug = require('pug')
const path = require('path')
const { argv } = require('yargs')
const { CollegiateDictionary, WordNotFoundError } = require('mw-dict')
const { DICT_API_KEY } = require('./config')

const app = new Koa()
const dict = new CollegiateDictionary(DICT_API_KEY)
const render = pug.compileFile(path.join(__dirname, 'index.pug'))
app.use(
  ratelimit({
    db: new Redis(),
    duration: 60000,
    max: 20
  })
)
app.use(
  router.post('/word/:word', async (ctx, word) => {
    try {
      ctx.type = 'application/json'
      let results = await dict.lookup(word)
      results = results.filter(r => r.word == word)
      let output = results.map(
        ({ word, functional_label, pronunciation, definition }) => {
          let html = `<h1>${word}</h1><p><em>${functional_label}</em></p>${render(
            { definition }
          )}`
          return {
            pronunciation,
            html
          }
        }
      )
      ctx.body = JSON.stringify(output)
    } catch (e) {
      if (e instanceof WordNotFoundError) {
        ctx.status = 404
        ctx.body = 'Word not found.'
      } else {
        console.log(e.message)
        ctx.status = 500
        ctx.body = 'Error'
      }
    }
  })
)
app.listen(argv.port || 80)
console.log(`listening on port ${argv.port}`)