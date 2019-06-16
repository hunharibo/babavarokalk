import LoanDueDate from "../objectmodel/LoanDueDate";
import Globals from '.././config.json';
import { Decimal } from 'decimal.js';

export default class BabavaroSuspensionService {
    private static _instance: BabavaroSuspensionService;
    public static GetInstance(): BabavaroSuspensionService {
        if (!this._instance) this._instance = new BabavaroSuspensionService();
        return this._instance;
    }

    //TODO: rengeteg eset van, mi van ha "átlapolódnak" a felfüggesztési időszakok, mi van ha ikrek születnek
    //Mi van ha második gyerek után is akar prolongálni és lehet is neki, mert nem a max futamidőre vette fel eredetileg, ezért belefér még neki a maximumba?

    public CalcSuspension(duedate: LoanDueDate): boolean {
        //első gyerek
        if (duedate.OwnerLoan.ChildrenBirthTermNumbers[0] &&
            duedate.TermNumber >= duedate.OwnerLoan.ChildrenBirthTermNumbers[0].BirthTermNumber &&
            duedate.TermNumber < duedate.OwnerLoan.ChildrenBirthTermNumbers[0].BirthTermNumber + Globals.SuspensionDuration &&
            duedate.OwnerLoan.ChildrenBirthTermNumbers[0].SuspenseRequired) {
            duedate.IsSuspended = true;
            return true;
        }
        //második gyerek
        else if (duedate.OwnerLoan.ChildrenBirthTermNumbers[1] &&
            duedate.TermNumber >= duedate.OwnerLoan.ChildrenBirthTermNumbers[1].BirthTermNumber &&
            duedate.TermNumber < duedate.OwnerLoan.ChildrenBirthTermNumbers[1].BirthTermNumber + Globals.SuspensionDuration &&
            duedate.OwnerLoan.ChildrenBirthTermNumbers[1].SuspenseRequired) {
            duedate.IsSuspended = true;
            return true;
        }
        else return false;
    }
}