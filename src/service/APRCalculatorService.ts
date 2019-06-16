import Globals from '.././config.json';
import Loan from "../objectmodel/Loan";
import Decimal from "decimal.js";
import { AprCalcMode } from "../objectmodel/Common";

export default class APRCalculatorService {
    private static _instance: APRCalculatorService;
    public static GetInstance(): APRCalculatorService {
        if (!this._instance) this._instance = new APRCalculatorService();
        return this._instance;
    }



    public CalcAPR(loan: Loan): Decimal {
        //Ügyfélcashflow számolása: kamat+tőke+payback+kezességvállalási díj
        let APR: Decimal = new Decimal(0.5);
        let dayscumulated: Decimal = new Decimal(0);
        const discountfactors: Decimal[] = new Array<Decimal>();
        const cashflows: Decimal[] = new Array<Decimal>();
        loan.DueDates.forEach(duedate => {
            const cashflow = duedate.Instalment.plus(duedate.GuaranteeFee).toDecimalPlaces(0);
            if (Globals.APRCalcMode === AprCalcMode.FirstDaily) {
                //Első esedékesség tényleges napok száma, utána viszont periodikus 365/12 - ÉVEKBEN KELL KIFEJEZNI!!!
                if (duedate.IsFirst) dayscumulated = dayscumulated.add(duedate.DaysSince);
                else dayscumulated = dayscumulated.add((new Decimal(365)).dividedBy(12));
            }
            else if (Globals.APRCalcMode === AprCalcMode.AllDaily){
                dayscumulated = dayscumulated.add(duedate.DaysSince);
            }
            else if(Globals.APRCalcMode === AprCalcMode.SubsidyDaily){
                if (duedate.HasInterestSubsidy) dayscumulated = dayscumulated.add(duedate.DaysSince);
                else dayscumulated = dayscumulated.add((new Decimal(365)).dividedBy(12));
            }
            else{
                dayscumulated = dayscumulated.add((new Decimal(365)).dividedBy(12));
            }
            discountfactors.push(dayscumulated.dividedBy(365));
            cashflows.push(cashflow);
        });
        
        let teststep: Decimal = new Decimal(0.5);
        let testresult: Decimal = new Decimal(1);
        const maxiterations = 100;
        for (let index = 0; index < maxiterations; index++) {
            let sumdiscountedcashflow = new Decimal(0);
            for (let index = 0; index < cashflows.length; index++) {
                const powerbase = APR.dividedBy(100).plus(1);
                const power = powerbase.pow(discountfactors[index]);
                const cashflowdiscounted = cashflows[index].dividedBy(power);
                sumdiscountedcashflow = sumdiscountedcashflow.add(cashflowdiscounted);
            }
            //console.log(sumdiscountedcashflow.toDecimalPlaces(8).toFixed(8));
            testresult = new Decimal(sumdiscountedcashflow).minus(loan.LoanAmount);
            //console.log(testresult.toDecimalPlaces(8).toFixed(8));
            if (testresult.lessThanOrEqualTo(new Decimal(0.000000001)) && testresult.greaterThanOrEqualTo(new Decimal(-0.000000001))) break;
            if (testresult.greaterThan(new Decimal(0))) {
                teststep = teststep.times(2);
                APR = APR.add(teststep);
            }
            else {
                teststep = teststep.dividedBy(2);
                APR = APR.sub(teststep);
            }
        }
        return APR;
    }
}