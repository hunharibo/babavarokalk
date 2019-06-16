import Globals from '.././config.json';
import LoanDueDate from '../objectmodel/LoanDueDate';
import { LoanPaymentType } from '../objectmodel/Common';
import { Decimal } from 'decimal.js';

/* Kamatszámoló szolgáltatás, ÁKK és gyermekszületés stb. alapján megmondja, hogy egy adott esedékességben mi lesz a kamatláb
*/
export default class InterestCalculatorService {

    private static _instance: InterestCalculatorService;
    public static GetInstance(): InterestCalculatorService {
        if (!this._instance) this._instance = new InterestCalculatorService();
        return this._instance;
    }

    public CalcInterestRate(duedate: LoanDueDate): Decimal {
        duedate.InterestSubsidy = new Decimal(0);
        if (duedate.IsFirst) return new Decimal(0);
        //AKK szorzó
        let finalsubsidizedinterestrate: Decimal = new Decimal(Globals.AKK * Globals.AKKmultiplier + Globals.SubsidizedInterestRate);
        let finalnochildreninterestrate: Decimal = new Decimal(Globals.AKK * Globals.AKKmultiplier + Globals.NoChildrenInterestRate);
        //365/360 korrekció
        if (Globals["365correction"]) finalsubsidizedinterestrate = finalsubsidizedinterestrate.times(365).dividedBy(360);
        if (Globals["365correction"]) finalnochildreninterestrate = finalnochildreninterestrate.times(365).dividedBy(360);
        //kamattámogatás
        if (duedate.TermNumber <= Globals.ChildMustBeBornBy || duedate.OwnerLoan.ChildrenBirthTermNumbers.length > 0) {
            duedate.PaymentType = LoanPaymentType.NoInterest;
            //kamattámogatás itt van kerekítve!!!
            if(!Globals["365correctionOnSubsidy"]){
                const correction = new Decimal(1).times(360).dividedBy(365);
                duedate.InterestSubsidy = duedate.OwnerLoan.DueDates[duedate.TermNumber - 1].Balance.times(finalsubsidizedinterestrate.times(correction).dividedBy(365).dividedBy(100).times(duedate.DaysSince)).toDecimalPlaces(0);
            }
            else duedate.InterestSubsidy = duedate.OwnerLoan.DueDates[duedate.TermNumber - 1].Balance.times(finalsubsidizedinterestrate.dividedBy(365).dividedBy(100).times(duedate.DaysSince)).toDecimalPlaces(0);
        }
        if (duedate.PaymentType === LoanPaymentType.NoInterest) return new Decimal(0);
        if (duedate.OwnerLoan.ChildrenBirthTermNumbers.length < 1 && duedate.TermNumber > Globals.ChildMustBeBornBy) {
            return finalnochildreninterestrate.toDecimalPlaces(2); //Ha nincs gyerek
        }
    }

    public CalcInterestPayback(duedate: LoanDueDate): Decimal {
        if (duedate.TermNumber === Globals.ChildMustBeBornBy + 1 && duedate.OwnerLoan.ChildrenBirthTermNumbers.length === 0) {
            let retval = new Decimal(0); //Eddig a hónapig kumulált kamattámogatás szumma összege
            for (let index = 0; index <= Globals.ChildMustBeBornBy; index++) {
                retval = retval.add(duedate.OwnerLoan.DueDates[index].InterestSubsidy);
            }
            return retval;
        }
        else return new Decimal(0);
    }

}