"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secondsThreshold = void 0;
const croner_1 = require("croner");
const checkNewTrans_1 = require("./checkNewTrans");
// setup how many seconds to do the cron check
exports.secondsThreshold = 60;
const cronSyntax = `*/${exports.secondsThreshold} * * * * *`;
// Basic: Run a function at the interval defined by a cron expression
const job = (0, croner_1.Cron)(cronSyntax, () => {
    console.log("This will run every fifth second");
    (0, checkNewTrans_1.checkNewTrans)(checkNewTrans_1.getTodayTrans, exports.secondsThreshold)
        .then((newTransactions) => {
        if (newTransactions.length === 0) {
            console.log("No new transactions.");
            return;
        }
        console.log(`There are ${newTransactions.length} new transactions.`);
        console.log("New Transactions:", JSON.stringify(newTransactions));
        // sendDiscord("hi test");
    })
        .catch((error) => {
        console.error("Error:", error);
    });
}).trigger();
