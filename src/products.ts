import { VercelRequest, VercelResponse } from "@vercel/node";
import { createConnection, Connection, QueryError, FieldPacket } from "mysql2";

export default async (request: VercelRequest, response: VercelResponse) => {
  const { DATABASE_URL } = process.env;
  console.log("DATABASE_URL", DATABASE_URL);
  if (!DATABASE_URL) {
    response.status(500).send("Server config problem");
    return;
  }
  if (request.method !== "GET") {
    response.status(405).send("Method Not Allowed");
    return;
  }
  const id = request.query["id"] as string;
  const connection = createConnection(DATABASE_URL);
  const rawProducts = await runParameterizedSQLQuery(
    connection,
    "select * from PRODUCTS where id = ?",
    [id]
  );
  const products = deserializeFields(rawProducts);
  console.log("Length", products.length);
  response.send(products);
};

function runParameterizedSQLQuery(
  connection: Connection,
  sql: string,
  fields: string[]
): Promise<any[]> {
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

function deserializeFields(rawProducts: any[]): any[] {
  return rawProducts.map((product) => deserializeFieldProduct(product));
}

function deserializeFieldProduct(product: any): any {
  product.options = JSON.parse(product.options);
  product.price = JSON.parse(product.price);
  return {...product};
}