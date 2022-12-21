import { VercelRequest, VercelResponse } from "@vercel/node";
import { createConnection, Connection, QueryError, FieldPacket } from "mysql2";

export default (request: VercelRequest, response: VercelResponse) => {
  if (!process.env.DATABASE_URL) {
    response.status(500).send("Server config problem");
    return;
  }
  if (request.method !== 'GET') {
    response.status(405).send("Method Not Allowed");
    return;
  }
  const id = getPathParam( request.url ?? '' );
  const connection = createConnection(process.env.DATABASE_URL);
  const products = runParameterizedSQLQuery(
    connection,
    'select * from PRODUCTS where id = ?',
    [id]
  );
  response.send(products);
};

function runParameterizedSQLQuery<T>(
  connection: Connection,
  sql: string,
  fields: string[]
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    connection.query(
      sql,
      [...fields],
      (err: QueryError | null, result: any[], fields: FieldPacket[]) => {
        if (!err) {
          resolve(result);
        } else {
          console.log("err =>", err);
          reject(err);
        }
      }
    );
  });
}

function getPathParam(incomingUrl: string):string{
  const urlObj = new URL(incomingUrl);
  const {pathname} = urlObj;
  const paths = pathname.split('/');
  console.log(paths);
  return paths.length>=4 ? paths[3] : '';
}

// console.log(getPathParam('https://the-phone-ka9oo8o78-vladimirbat.vercel.app/api/products/abc123'));