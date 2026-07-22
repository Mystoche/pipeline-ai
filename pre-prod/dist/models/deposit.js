"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deposit = void 0;
const index_1 = require("./index");
const uuid_1 = require("uuid");
const { DateTime } = require("luxon");
class Deposit {
    constructor(amount, currency, correspondent, msisdn, statementDescription, country, preAuthorisationCode) {
        const address = new index_1.Address(msisdn);
        this.payer = new index_1.Payer('MSISDN', address);
        this.depositId = (0, uuid_1.v4)();
        this.amount = amount;
        this.currency = currency;
        this.country = country ? country : null;
        this.correspondent = correspondent;
        this.customerTimestamp = DateTime.now().toISO();
        this.statementDescription = statementDescription;
        this.preAuthorisationCode = preAuthorisationCode ? preAuthorisationCode : null;
    }
}
exports.Deposit = Deposit;
