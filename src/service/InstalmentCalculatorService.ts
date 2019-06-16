import Globals from '.././config.json';
import LoanDueDate from '../objectmodel/LoanDueDate';
import { LoanPaymentType } from '../objectmodel/Common';
import { Decimal } from 'decimal.js';
import { Finance } from 'financejs';

export default class InstalmentCalculatorService {
    private static _instance: InstalmentCalculatorService;
    private _calc: Finance;
    private _lastcalculatedvalue: Decimal;
    private _instalmentinvalid: boolean;
    public static GetInstance(): InstalmentCalculatorService {
        if (!this._instance) this._instance = new InstalmentCalculatorService();
        return this._instance;
    }

    constructor() {
        this._calc = new Finance();
    }

    private CheckInstalmentValidity(duedate: LoanDueDate): boolean {
        if (this._instalmentinvalid) return true; //ha már eleve igaz, akkor early exit
        //Mikor változik a részlet? Ha változik a: futamidő, kamatláb, kamatozás módja, vagy a fennálló tartozás (pl. előtörlesztés).
        else {
            if (!duedate.IsFirst && duedate.OwnerLoan.DueDates[duedate.TermNumber - 1].PaymentType != duedate.PaymentType) return true; //ha változik a kamatozás módja
            else if (!duedate.IsFirst && duedate.OwnerLoan.DueDates[duedate.TermNumber - 1].InterestRate.toNumber() !== duedate.InterestRate.toNumber()) return true; //ha változik a kamatláb
            else if(duedate.TermNumber === duedate.maxTerm) return true; //ha utolsó futamidő
            else if(!duedate.IsFirst && duedate.OwnerLoan.DueDates[duedate.TermNumber - 1].IsSuspended && !duedate.IsSuspended) return true; //ha vége a felfüggesztésnek
            else return false;
        }
    }

    public CalcInstalment(duedate: LoanDueDate): Decimal {
        this._instalmentinvalid = this.CheckInstalmentValidity(duedate);
        if (!this._instalmentinvalid && !duedate.IsFirst) return this._lastcalculatedvalue;
        else {
            let instalment: Decimal;
            if (duedate.IsFirst) {
                instalment = new Decimal(0);
                this._instalmentinvalid = true;
            }
            else if(duedate.TermNumber === duedate.maxTerm){
                const previousbalance = duedate.OwnerLoan.DueDates[duedate.TermNumber -1].Balance;
                instalment = previousbalance.add(previousbalance.times(duedate.InterestRate.dividedBy(12).dividedBy(100))).toDecimalPlaces(0);  
            }
            else if (duedate.PaymentType === LoanPaymentType.Annuity) {
                instalment = new Decimal(this._calc.AM(duedate.Balance.toNumber(), duedate.InterestRate.toNumber(), duedate.maxTerm - (duedate.TermNumber - 1), 1)).toDecimalPlaces(0);
                this._instalmentinvalid = false;
            }
            else if (duedate.PaymentType === LoanPaymentType.NoInterest) {
                instalment = duedate.OwnerLoan.DueDates[duedate.TermNumber - 1].Balance.dividedBy(new Decimal((duedate.maxTerm - (duedate.TermNumber - 1)))).toDecimalPlaces(0);
                this._instalmentinvalid = false;
            }
            this._lastcalculatedvalue = instalment;
            return instalment;
        }
    }
}