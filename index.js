const Koa = require('koa')
const router = require('koa-route')
const views = require('koa-views')
const ratelimit = require('koa-ratelimit')
const Redis = require('ioredis')
const { argv } = require('yargs')
const { CollegiateDictionary, WordNotFoundError } = require('mw-dict')
const { DICT_API_KEY } = require('./config')

const app = new Koa()
const dict = new CollegiateDictionary(DICT_API_KEY)
app.use(
  ratelimit({
    db: new Redis(),
    duration: 60000,
    max: 20
  })
)
app.use(views(__dirname), {
  map: {
    pug: 'pug'
  }
})
app.use(
  router.post('/word/:word', async (ctx, word) => {
    try {
      ctx.type = 'text/html'
      let results = await dict.lookup(word)
      results = results.filter(r => r.word == word)
      await ctx.render('index.pug', {
        results
      })
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
