import express from 'express'

const app = express()
const REPLACEME_port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(REPLACEME_port, () => {
  console.log(`Example app listening on port ${REPLACEME_port}`)
})