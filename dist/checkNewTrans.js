"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkNewTrans = exports.getTodayTrans = void 0;
require("dotenv/config");
const axios_1 = __importDefault(require("axios"));
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore");
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
let today = dayjs().format("DD/MM/YYYY");
function formatNumberToSixDigits(PCTime) {
    if (PCTime) {
        return PCTime.padStart(6, "0");
    }
    return "";
}
function getTransTimeAsDayjs(dateString, timeString) {
    const formattedDateTime = `${dateString} ${timeString}`;
    const dayjsObject = dayjs(formattedDateTime, "DD/MM/YYYY HHmmss");
    return dayjsObject;
}
function getNowMinusSeconds(seconds) {
    const now = dayjs();
    const subtractedTime = now.subtract(seconds, "second");
    return subtractedTime;
}
// do a post axios to VCB API using async/await
// fetch the data
function getTodayTrans() {
    return __awaiter(this, void 0, void 0, function* () {
        const data = {
            username: process.env.VCB_USERNAME,
            password: process.env.VCB_PASSWORD,
            accountNumber: process.env.VCB_ACCOUNT_NUMBER,
            begin: today,
            end: today,
        };
        const config = {
            method: "post",
            url: process.env.VCB_API_URL,
            headers: {
                "Content-Type": "application/json",
            },
            data: JSON.stringify(data),
        };
        const response = yield (0, axios_1.default)(config);
        let transactions = response.data.results;
        if (!Array.isArray(transactions)) {
            // If transactions is not an array, wrap it in an array
            transactions = [transactions];
        }
        return transactions;
    });
}
exports.getTodayTrans = getTodayTrans;
function checkNewTrans(getTransactions, secondsThreshold) {
    return __awaiter(this, void 0, void 0, function* () {
        const transactions = yield getTransactions();
        const nowMinus = getNowMinusSeconds(secondsThreshold);
        const newTransactions = transactions.filter((transaction) => {
            const transactionDate = transaction.tranDate;
            const transactionTime = formatNumberToSixDigits(transaction.PCTime);
            const transTime = getTransTimeAsDayjs(transactionDate, transactionTime);
            // console.log("transTime: ", transTime.format("DD/MM/YY HH:mm:ss"));
            // console.log("now: ", nowMinus.format("DD/MM/YY HH:mm:ss"));
            return (transTime.isSameOrAfter(nowMinus) && transTime.isSameOrBefore(dayjs()));
        });
        return newTransactions;
    });
}
exports.checkNewTrans = checkNewTrans;
