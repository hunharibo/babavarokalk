import LoanDueDate from "../objectmodel/LoanDueDate";
import Globals from '.././config.json';
import { Decimal } from 'decimal.js';

export default class BabavaroGuaranteeService {
    private static _instance: BabavaroGuaranteeService;
    private _lastcalculatedvalue: Decimal;
    public static GetInstance(): BabavaroGuaranteeService {
        if (!this._instance) this._instance = new BabavaroGuaranteeService();
        return this._instance;
    }

    public CalcGuaranteeFee(duedate: LoanDueDate): Decimal {
        let retval: Decimal;
        if (duedate.IsSuspended || duedate.IsFirst) retval = new Decimal(0); //Felfüggesztés alatt és folyósításkor nincs díj
        else if (duedate.OwnerLoan.EarlyClosureInTermNumber && duedate.OwnerLoan.EarlyClosureInTermNumber < duedate.TermNumber) retval = new Decimal(0); //harmadik gyerek után sincs már díj.
        else if (duedate.OwnerLoan.DueDates[duedate.TermNumber - 2]) { //ha a kettővel korábbi index nem out of bounds
            if (duedate.OwnerLoan.DueDates[duedate.TermNumber - 2].Date.getMonth() === 11)  //a hónapok 0 based index, január 0, december 11
            {
                retval = duedate.OwnerLoan.DueDates[duedate.TermNumber - 2].Balance.times(Globals.GuaranteeFeeRate / 12 / 100).toDecimalPlaces(0);
            }
            else retval = this._lastcalculatedvalue;
        }
        else {
            retval = this._lastcalculatedvalue;
        }
        this._lastcalculatedvalue = retval;
        if (duedate.IsFirst) this._lastcalculatedvalue = duedate.Balance.times(Globals.GuaranteeFeeRate / 12 / 100).toDecimalPlaces(0);
        return retval;
    }
}