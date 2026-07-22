"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("../controllers/controller");
const mainRouter = (0, express_1.Router)();
mainRouter.post('/', controller_1.createDeposit);
mainRouter.get('/', controller_1.depositForm);
exports.default = mainRouter;
