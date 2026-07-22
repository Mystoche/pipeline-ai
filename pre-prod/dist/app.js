"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
let mustacheExpress = require('mustache-express');
const main_routes_1 = __importDefault(require("./routes/main-routes")); // Route connected
const app = (0, express_1.default)();
require('dotenv').config();
app.use(express_1.default.urlencoded());
app.set('views', `${__dirname}/views`);
app.set('view engine', 'mustache');
app.engine('mustache', mustacheExpress());
app.use('/', main_routes_1.default); // This means all route path preceed this path
// Below route is trigerred when any error is is thrown
app.use((err, req, res, next) => {
    res.status(500).json({ message: err.message });
});
app.listen(process.env.PORT ? process.env.PORT : 3000);
