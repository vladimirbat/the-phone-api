import { VercelRequest, VercelResponse } from "@vercel/node";

export default (request: VercelRequest, response: VercelResponse) =>
  response.send({
    data: "hello world",
  });
