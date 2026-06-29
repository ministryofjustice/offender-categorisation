import express, { Router } from 'express'

export default function setUpWebRequestParsing(): Router {
  const router = express.Router()
  router.use(express.json())
  router.use(express.urlencoded({ extended: true }))

  // Express 5: req.body is no longer initialised to {} and returns undefined when no body is sent. Express 4 returns {} by default
  router.use((req, _res, next) => {
    req.body = req.body || {}
    next()
  })

  return router
}
