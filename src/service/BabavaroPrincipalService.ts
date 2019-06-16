import LoanDueDate from "../objectmodel/LoanDueDate";
import Globals from '.././config.json';
import { Decimal } from 'decimal.js';

export default class BabavaroPrincipalService {
    private static _instance: BabavaroPrincipalService;
    public static GetInstance(): BabavaroPrincipalService {
        if (!this._instance) this._instance = new BabavaroPrincipalService();
        return this._instance;
    }

    public CalcPrincipalSubsidy(duedate: LoanDueDate): Decimal {
        if (duedate.OwnerLoan.ChildrenBirthTermNumbers[1] && duedate.TermNumber === duedate.OwnerLoan.ChildrenBirthTermNumbers[1].BirthTermNumber) {
            return duedate.OwnerLoan.DueDates[duedate.TermNumber - 1].Balance.times(Globals.SecondChildPrincipalSubsidy).toDecimalPlaces(0);
        }
        else if (duedate.OwnerLoan.ChildrenBirthTermNumbers[2] && duedate.TermNumber === duedate.OwnerLoan.ChildrenBirthTermNumbers[2].BirthTermNumber) {
            return duedate.OwnerLoan.DueDates[duedate.TermNumber - 1].Balance.times(Globals.ThirdChildPrincipalSubsidy).toDecimalPlaces(0);
        }
        else return new Decimal(0);
    }
}