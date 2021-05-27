import { FastifyInstance, FastifySchema } from "fastify";
import WordCounter from "../WordCounter";
import axios from "axios";
import * as fs from "fs/promises";
import * as streamFs from "fs";
import uriToPath from "file-uri-to-path";

type WordStatisticsQueryParameters = { word: "string" };

type WordConsumeRequest =
  | { text: string }
  | { url: string }
  | { serverPath: string };

const wordConsumeSchema: FastifySchema = {
  body: {
    oneOf: [
      {
        type: "object",
        properties: {
          text: {
            type: "string",
          },
        },
        required: ["text"],
      },
      {
        type: "object",
        properties: {
          url: {
            type: "string",
            format: "uri",
          },
        },
        required: ["url"],
      },
      {
        type: "object",
        properties: {
          serverPath: {
            type: "string",
            format: "uri",
          },
        },
        required: ["serverPath"],
      },
    ],
  },
};

export default async function wordCounterController(
  wordCounter: WordCounter,
  fastify: FastifyInstance
) {
  fastify.get("/", async function () {
    return wordCounter.getAllWordCounts();
  });

  fastify.get<{ Querystring: WordStatisticsQueryParameters }>(
    "/statistics",
    async function (request, reply) {
      const wordInput = request.query.word;
      if (!wordInput) {
        reply.status(400);
        return {
          error: "Please provide a word using the `word` query parameter",
        };
      }
      return wordCounter.getWordCount(wordInput);
    }
  );

  fastify.post<{ Body: WordConsumeRequest }>(
    "/consume",
    { schema: wordConsumeSchema },
    async function (request, reply) {
      const wordConsumeInput = request.body;

      if ("text" in wordConsumeInput) {
        wordCounter.countWords(wordConsumeInput.text);
      }

      if ("url" in wordConsumeInput) {
        try {
          const response = await axios.get(wordConsumeInput.url, {
            responseType: "stream",
          });
          wordCounter.countWordsInStream(response.data);
        } catch (err) {
          return {
            error: `Could not read data from url ${wordConsumeInput.url}`,
          };
        }
      }

      if ("serverPath" in wordConsumeInput) {
        const path = uriToPath(wordConsumeInput.serverPath);
        try {
          // Ensure that file exists
          await fs.stat(path);
          wordCounter.countWordsInStream(streamFs.createReadStream(path));
        } catch (err) {
          return {
            error: `Could not read data from local file ${path}`,
          };
        }
      }

      reply.status(204);
    }
  );
}
