import LoanDueDate from "../objectmodel/LoanDueDate";
import Globals from '.././config.json';

export default class BabavaroInterestSubsidyService {
    private static _instance: BabavaroInterestSubsidyService;
    public static GetInstance(): BabavaroInterestSubsidyService {
        if (!this._instance) this._instance = new BabavaroInterestSubsidyService();
        return this._instance;
    }

    public CalcHasSubsidy(duedate: LoanDueDate): boolean {
        if (duedate.OwnerLoan.ChildrenBirthTermNumbers.length > 0 || duedate.TermNumber < Globals.ChildMustBeBornBy + 1){
            duedate.HasInterestSubsidy = true;
            return true;
        }
        else return false;
    }
}