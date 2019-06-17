import Loan from "./objectmodel/Loan";

self.addEventListener("message", (message) => {
    const data = message.data;
    const loan = new Loan(data.loanamt, data.term, data.day, data.children);
    postMessage(loan.APR.toString());
});