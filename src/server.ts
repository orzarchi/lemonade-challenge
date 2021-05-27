import fastify, { FastifyInstance } from "fastify";
import wordCounterController from './controller/wordCounterController';
import WordCounter from './WordCounter';

const wordCounter = new WordCounter();

async function router(fastify: FastifyInstance) {
  fastify.register(wordCounterController.bind(null, wordCounter), { prefix: "/words" });
}

 async function start() {
  const server = fastify({
    logger: { prettyPrint: true },
  });

  server.register(router);

  try {
    await server.listen(8080)
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start();
