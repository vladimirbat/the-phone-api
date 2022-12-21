var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createConnection } from "mysql2";
const handler = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!isRequestOk(request, response)) {
        return;
    }
    const id = request.query["id"];
    const page = request.query["page"];
    const pageSize = request.query["pageSize"];
    const connection = createConnection(DATABASE_URL);
    let rawProducts = [];
    if (id) {
        rawProducts = yield getProductsById(connection, id);
    }
    else if (page && pageSize) {
        rawProducts = yield getProducts(connection, page, pageSize);
    }
    else {
        response.status(400).send("Invalid input parámeters");
        return;
    }
    const products = deserializeFields(rawProducts);
    console.log("Length", products.length);
    response.send(products);
});
function getProductsById(connection, id) {
    const sql = "select * from PRODUCTS where id = ?";
    return promisedQuery(connection, sql, [id]);
}
function getProducts(connection, pageStr, pageSizeStr) {
    const sql = "select * from PRODUCTS limit ?,?";
    const page = parseInt(pageStr);
    const pageSize = parseInt(pageSizeStr);
    const jump = pageSize * (page - 1);
    return promisedQuery(connection, sql, [jump, pageSize]);
}
function promisedQuery(connection, sql, params) {
    return new Promise((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        connection.query(sql, [...params], (err, result) => {
            if (!err) {
                resolve(result);
            }
            else {
                console.log("err =>", err);
                reject(err);
            }
        });
    });
}
function deserializeFields(rawProducts) {
    return rawProducts.map((product) => deserializeFieldProduct(product));
}
function deserializeFieldProduct(product) {
    product.options = JSON.parse(product.options);
    product.price = JSON.parse(product.price);
    return Object.assign({}, product);
}
function isRequestOk(request, response) {
    const { DATABASE_URL } = process.env;
    if (!DATABASE_URL) {
        response.status(500).send("Server config problem");
        return false;
    }
    if (request.method !== "GET") {
        response.status(405).send("Method Not Allowed");
        return false;
    }
    return true;
}
const allowCors = (fn) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
    res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");
    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }
    return yield fn(req, res);
});
module.exports = allowCors(handler);
