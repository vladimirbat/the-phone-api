import { createConnection } from "mysql2";
export default (request, response) => {
    var _a;
    if (!process.env.DATABASE_URL) {
        response.status(500).send("Server config problem");
        return;
    }
    if (request.method !== 'GET') {
        response.status(405).send("Method Not Allowed");
        return;
    }
    const id = getPathParam((_a = request.url) !== null && _a !== void 0 ? _a : '');
    const connection = createConnection(process.env.DATABASE_URL);
    const products = runParameterizedSQLQuery(connection, 'select * from PRODUCTS where id = ?', [id]);
    response.send(products);
};
function runParameterizedSQLQuery(connection, sql, fields) {
    return new Promise((resolve, reject) => {
        connection.query(sql, [...fields], (err, result, fields) => {
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
function getPathParam(incomingUrl) {
    const urlObj = new URL(incomingUrl);
    const { pathname } = urlObj;
    const paths = pathname.split('/');
    console.log(paths);
    return paths.length >= 4 ? paths[3] : '';
}
// console.log(getPathParam('https://the-phone-ka9oo8o78-vladimirbat.vercel.app/api/products/abc123'));
