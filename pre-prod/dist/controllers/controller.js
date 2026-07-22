"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = exports.checkDeposit = exports.sendDeposit = exports.depositForm = exports.createDeposit = void 0;
const axios_1 = __importDefault(require("axios"));
const models_1 = require("../models");
const currencyLookup = {
    "COG": "XAF",
    "CMR": "XAF",
    "CIV": "XOF",
    "COD": "CDF",
    "GHA": "GHS",
    "KEN": "KES",
    "MWI": "MWK",
    "RWA": "RWF",
    "SEN": "XOF",
    "TZA": "TZS",
    "UGA": "UGX",
    "ZMB": "ZMW"
};
const statusBackOff = [
    0.1, 1, 15, 30, 90, 180
];
const createDeposit = async (req, res, next) => {
    const body = req.body;
    let errorMessage = "";
    let errorFields = [];
    if (!body.msisdn)
        errorFields.push('MSISDN');
    if (!body.amount)
        errorFields.push('Amount');
    if (!body.description)
        errorFields.push('StatementDescription');
    const country = body.country;
    if (!country)
        errorFields.push('Country');
    if (errorFields.length > 0) {
        errorMessage = `Please complete ${errorFields.join(', ')} fields`;
    }
    // @ts-ignore
    const currency = currencyLookup[country];
    const deposit = new models_1.Deposit(body.amount, currency, body[`MNO_${body.country}`], body.msisdn, body.description, body.country);
    let status = "";
    let message = "";
    try {
        const result = await (0, exports.sendDeposit)(deposit);
        switch (result.data.status) {
            case "ACCEPTED":
                status = "success";
                message = "Deposit request sent successfully";
                break;
            case "REJECTED":
                status = "danger";
                message = result.data.rejectionReason.rejectionCode;
                break;
            case "DUPLICATE_IGNORED":
                status = "danger";
                message = "Duplicate request";
                break;
            default:
                status = "danger";
                message = "Unknown error";
                break;
        }
    }
    catch (error) {
        errorMessage = `Error from pawaPay: ${error.message}`;
        status = "danger";
    }
    if (status == "success") {
        status = 'warning';
        message = "Transaction Timeout or Unknown Error";
        for (let i = 0; i < statusBackOff.length; i++) {
            await (0, exports.sleep)(statusBackOff[i]);
            try {
                const result = await (0, exports.checkDeposit)(deposit);
                console.log(`Status Check Log: ${JSON.stringify(result.data)}`);
                switch (result.data[0].status) {
                    case "COMPLETED":
                        status = "success";
                        message = "Deposit request completed successfully";
                        break;
                    case "SUBMITTED":
                        status = 'warning';
                        message = "Transaction Timeout or Unknown Error";
                        break;
                    case "FAILED":
                        status = "danger";
                        message = result.data[0].failureReason.failureMessage;
                        break;
                    case "ENQUEUED":
                        status = "danger";
                        message = "Transaction enqueued request";
                        break;
                    default:
                        status = "danger";
                        message = "Unknown error";
                        break;
                }
            }
            catch (error) {
                errorMessage = `Error from pawaPay: ${error.message}`;
                status = "danger";
            }
            if (status == "success" || status == "danger") {
                break;
            }
        }
    }
    res.render('order', {
        "msisdn": body.msisdn,
        "amount": body.amount,
        "description": body.description,
        "country": body.country,
        "mno": body[`MNO_${body.country}`],
        "errorMessage": errorMessage,
        "pawaPayStatus": status,
        "pawaPayMessage": message,
        "depositId": deposit.depositId,
    });
};
exports.createDeposit = createDeposit;
const depositForm = (req, res, next) => {
    const body = req.body;
    res.render('order', {
        "country": "BEN"
    });
};
exports.depositForm = depositForm;
const sendDeposit = async (deposit) => {
    const config = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.API_KEY}`
        }
    };
    const url = `${process.env.API_URL}/deposits`;
    const dataBlock = {
        depositId: deposit.depositId,
        amount: deposit.amount.toString(),
        currency: deposit.currency,
        correspondent: deposit.correspondent,
        payer: {
            type: deposit.payer.type,
            address: {
                value: deposit.payer.address.value,
            }
        },
        customerTimestamp: deposit.customerTimestamp,
        statementDescription: deposit.statementDescription
    };
    return await axios_1.default.post(url, dataBlock, config);
};
exports.sendDeposit = sendDeposit;
const checkDeposit = async (deposit) => {
    const config = {
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.API_KEY}`
        }
    };
    const url = `${process.env.API_URL}/deposits/${deposit.depositId}`;
    return await axios_1.default.get(url, config);
};
exports.checkDeposit = checkDeposit;
const sleep = async (seconds) => {
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
};
exports.sleep = sleep;
