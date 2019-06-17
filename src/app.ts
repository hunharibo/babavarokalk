import { IChildOption, IThreadMessage } from "./objectmodel/Common";

const loaninput = document.getElementById("loanamt") as HTMLInputElement;
const terminput = document.getElementById("term")  as HTMLInputElement;
const resultbox = document.getElementById("resultbox");
const examplebox = document.getElementById("examplebox");
const calcbtn = document.getElementById("calcbtn");
const child1nmb = document.getElementById("child1termnumber")  as HTMLInputElement;
const child2nmb = document.getElementById("child2termnumber")  as HTMLInputElement;
const child3nmb = document.getElementById("child3termnumber")  as HTMLInputElement;
const child1suspense = document.getElementById("child1suspense") as HTMLInputElement;
const child2suspense = document.getElementById("child2suspense")  as HTMLInputElement;
const child1termincrease = document.getElementById("child1termincrease") as HTMLInputElement;
const dueday = document.getElementById("dueday")  as HTMLInputElement;

calcbtn.onclick = function() {
    resultbox.innerHTML = '';
    examplebox.innerHTML = '';
    const child1number = parseInt(child1nmb.value);
    const child2number = parseInt(child2nmb.value);
    const child3number = parseInt(child3nmb.value);
    const childrenarray = new Array<IChildOption>();
    if (child1number && child1number > 0) childrenarray.push({ BirthTermNumber: child1number, SuspenseRequired: child1suspense.checked, TermIncreaseRequired: child1termincrease.checked });
    if (child2number && child2number > 0) childrenarray.push({ BirthTermNumber: child2number, SuspenseRequired: child2suspense.checked, TermIncreaseRequired: false });
    if (child3number && child3number > 0) childrenarray.push({ BirthTermNumber: child3number, SuspenseRequired: false, TermIncreaseRequired: false });
    /*const loan = new Loan(parseInt(loaninput.value), parseInt(terminput.value), parseInt(dueday.value), childrenarray);
    loan.PaintRepresentativeExample(examplebox);
    loan.PaintDueDates(resultbox);*/
    const worker = new Worker('./bundle.js');
    worker.postMessage({
        "loanamt": parseInt(loaninput.value),
        "term": parseInt(terminput.value),
        "day": parseInt(dueday.value),
        "children": childrenarray
    });
    console.log("fired");
    worker.onmessage = (message) => {
        const data:IThreadMessage = message.data;
        console.log(data);
    }
}