var loaninput = document.getElementById("loanamt");
var terminput = document.getElementById("term");
var resultbox = document.getElementById("resultbox");
var examplebox = document.getElementById("examplebox");
var calcbtn = document.getElementById("calcbtn");
var child1nmb = document.getElementById("child1termnumber");
var child2nmb = document.getElementById("child2termnumber");
var child3nmb = document.getElementById("child3termnumber");
var child1suspense = document.getElementById("child1suspense");
var child2suspense = document.getElementById("child2suspense");
var child1termincrease = document.getElementById("child1termincrease");
var dueday = document.getElementById("dueday");
calcbtn.onclick = function () {
    resultbox.innerHTML = '';
    examplebox.innerHTML = '';
    var child1number = parseInt(child1nmb.value);
    var child2number = parseInt(child2nmb.value);
    var child3number = parseInt(child3nmb.value);
    var childrenarray = new Array();
    if (child1number && child1number > 0)
        childrenarray.push({ BirthTermNumber: child1number, SuspenseRequired: child1suspense.checked, TermIncreaseRequired: child1termincrease.checked });
    if (child2number && child2number > 0)
        childrenarray.push({ BirthTermNumber: child2number, SuspenseRequired: child2suspense.checked, TermIncreaseRequired: false });
    if (child3number && child3number > 0)
        childrenarray.push({ BirthTermNumber: child3number, SuspenseRequired: false, TermIncreaseRequired: false });
    var worker = new Worker('./bundle.js');
    worker.postMessage({
        "loanamt": parseInt(loaninput.value),
        "term": parseInt(terminput.value),
        "day": parseInt(dueday.value),
        "children": childrenarray
    });
    console.log("fired");
    worker.onmessage = function (message) {
        var data = message.data;
        console.log(data);
    };
};
//# sourceMappingURL=app.js.map
