import { VercelRequest, VercelResponse } from '@vercel/node';
import { Connection, createConnection, QueryError } from 'mysql2';
import { SearchPhonesResponse } from './model/api.model';
import { Product } from './model/products.model';

type HandlerFunction = (request: VercelRequest, response: VercelResponse) => void;

const handler = async (request: VercelRequest, response: VercelResponse) => {
  const DATABASE_URL = process.env.DATABASE_URL as string;
  if (!isRequestOk(request, response)) {
    return;
  }
  const id = request.query['id'] as string;
  const pageStr = request.query['page'] as string;
  const pageSizeStr = request.query['pageSize'] as string;
  const query = request.query['query'] as string;
  const connection = createConnection(DATABASE_URL);
  let rawProducts = [];
  let total = 1;
  if (id) {
    console.log('Searching by id', id);
    rawProducts = await getProductsById(connection, id);
  } else if (pageStr && pageSizeStr ) {
    console.log('Searching by page', pageStr, pageSizeStr);
    const searchQuery = query ? query : '';
    const resultArray = await Promise.all([getProducts(connection, pageStr, pageSizeStr, searchQuery), getProductsCount(connection, searchQuery)]);
    rawProducts = resultArray[0];
    total = resultArray[1];
  } else {
    response.status(400).send('Invalid input parámeters');
    return;
  }
  const products = deserializeFields(rawProducts);
  console.log('Length', products.length);
  const page = parseInt(pageStr);
  const pageSize = parseInt(pageSizeStr);
  const searchPhonesResponse: SearchPhonesResponse = {
    total,
    page,
    pageSize,
    products,
  }
  response.send(searchPhonesResponse);
};

function getProductsById(connection: Connection, id: string): Promise<Product[]> {
  const sql = 'select * from PRODUCTS where id = ?';
  return promisedQuery(connection, sql, [id]);
}
function getProducts(connection: Connection, pageStr: string, pageSizeStr: string, searchQuery:string): Promise<Product[]> {
  const sql = 'select * from PRODUCTS where (MODEL LIKE ?) OR (BRAND LIKE ?) limit ?,?';
  const search = `%${searchQuery}%`;
  const page = parseInt(pageStr);
  const pageSize = parseInt(pageSizeStr);
  const jump = pageSize * (page - 1);
  return promisedQuery(connection, sql, [search, search, jump, pageSize]);
}

function getProductsCount(connection: Connection, searchQuery: string): Promise<number> {
  const search = `%${searchQuery}%`;
  const sql = `select count(id) as total from PRODUCTS where (MODEL like '${search}') or (BRAND like '${search}')`;
  return query<{total:number}>(connection, sql).then((data) => data[0].total);
}

function promisedQuery(connection: Connection, sql: string, params: unknown[]): Promise<Product[]> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connection.query(sql, [...params], (err: QueryError | null, result: any[]) => {
      if (!err) {
        resolve(result);
      } else {
        console.log('err =>', err);
        reject(err);
      }
    });
  });
}

function query<T>(connection: Connection, sql: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    connection.query(sql, [], (err: QueryError | null, result: any[]) => {
      if (!err) {
        resolve(result as T[]);
      } else {
        console.log('err =>', err);
        reject(err);
      }
    });
  });
}

function deserializeFields(rawProducts: Product[]): Product[] {
  return rawProducts.map((product) => deserializeFieldProduct(product));
}

function deserializeFieldProduct(product: Product): Product {
  product.options = JSON.parse(product.options as string);
  product.price = JSON.parse(product.price as string);
  return { ...product };
}

function isRequestOk(request: VercelRequest, response: VercelResponse): boolean {
  const { DATABASE_URL } = process.env;
  if (!DATABASE_URL) {
    response.status(500).send('Server config problem');
    return false;
  }
  if (request.method !== 'GET') {
    response.status(405).send('Method Not Allowed');
    return false;
  }
  return true;
}

const allowCors = (fn: HandlerFunction) => async (req: VercelRequest, res: VercelResponse) => {
  res.setHeader('Cache-Control', 'max-age=3600')
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};

module.exports = allowCors(handler);
