const Koa = require('koa')
const router = require('koa-route')
const ratelimit = require('koa-ratelimit')
const Redis = require('ioredis')
const pug = require('pug')
const path = require('path')
const { argv } = require('yargs')
const {
  CollegiateDictionary,
  LearnersDictionary,
  WordNotFoundError
} = require('mw-dict')
const { COLLEGIATE_DICT_API_KEY, LEARNERS_DICT_API_KEY } = require('./config')

const app = new Koa()
const collegiateDict = new CollegiateDictionary(COLLEGIATE_DICT_API_KEY)
const learnersDict = new LearnersDictionary(LEARNERS_DICT_API_KEY)
const render = pug.compileFile(path.join(__dirname, 'index.pug'))
app.use(
  ratelimit({
    db: new Redis(),
    duration: 60000,
    max: 20
  })
)

async function lookup(dict, word) {
  let results = await dict.lookup(word)
  results = results.filter(r => r.word == word)
  let output = results.map(
    ({ word, functional_label, pronunciation, definition }) => {
      let html = `<h1>${word}</h1><p><em>${functional_label}</em></p>${render({
        definition
      })}`
      return {
        word,
        pronunciation,
        html
      }
    }
  )
  return output
}
app.use(
  router.post('/word/:word', async (ctx, word) => {
    try {
      ctx.type = 'application/json'
      let collegiateResult = await lookup(collegiateDict, word)
      let learnersResult = await lookup(learnersDict, word)
      let words = learnersResult.map(result => result.word)
      let output = collegiateResult.map(result => {
        let index = words.indexOf(result.word)
        if (index > -1) {
          result.html = learnersResult[index].html + '<hr/>' + result.html
        }
        return result
      })
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
