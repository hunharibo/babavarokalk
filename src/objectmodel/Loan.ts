import LoanDueDate from "./LoanDueDate";
import { LoanPaymentType, IChildOption, AprCalcMode } from "./Common";
import moment, { Moment } from 'moment';
import { Decimal } from 'decimal.js';
import FindNextWorkingDayService from "../service/FindNextWorkingDayService";
import APRCalculatorService from "../service/APRCalculatorService";

export default class Loan {
    public DueDates: LoanDueDate[];
    public StartDate: Date;
    private MomentDate: Moment;
    public DueDay: number;
    public LoanAmount: number;
    public Term: number;
    public ProlongedTerm: number;
    public ChildrenBirthTermNumbers: IChildOption[];
    public EarlyClosureInTermNumber: number;
    public GuaranteeBaseOverride: number;
    public APR: Decimal;

    constructor(loanamount: number, term: number, dueday: number, childrenarray: IChildOption[]) {
        this.DueDay = dueday;
        this.LoanAmount = loanamount;
        this.MomentDate = moment();
        this.StartDate = FindNextWorkingDayService.GetInstance().FindNextWorkingDay(this.MomentDate).toDate();
        this.Term = term;
        this.ProlongedTerm = term;
        this.ChildrenBirthTermNumbers = childrenarray;
        this.Calculate();
    }

    public PaintRepresentativeExample(targetelement: HTMLElement) {
        let fullcost:number = 0;
        this.DueDates.forEach(duedate => {
            fullcost += duedate.Instalment.plus(duedate.GuaranteeFee).toDecimalPlaces(0).toNumber();
        });
        targetelement.insertAdjacentHTML('beforeend', `
        <h1 class="title">Hiteladatok</h1>
        <div class="notification">
            <table class="table">
                <tbody>
                    <tr>
                        <td>Kölcsön összege</td>
                        <td>${this.LoanAmount} Ft</td>
                    </tr>
                    <tr>
                        <td>Kölcsön futamideje</td>
                        <td>${this.Term} hónap</td>
                    </tr>
                    <tr>
                        <td>THM</td>
                        <td>${this.APR.toDecimalPlaces(2).toString()}%</td>
                    </tr>
                    <tr>
                        <td>Kezdeti havi törlesztőrészlet</td>
                        <td>${this.DueDates[1].Instalment} Ft</td>
                    </tr>
                    <tr>
                        <td>Kölcsön teljes díja</td>
                        <td>${fullcost - this.LoanAmount} Ft</td>
                    </tr>
                    <tr>
                        <td>Teljes visszafizetendő összeg</td>
                        <td>${fullcost} Ft</td>
                    </tr>                                                                                
                </tbody>
            </table>
        </div>
        `)
    }

    public PaintDueDates(targetelement: HTMLElement) {
        targetelement.insertAdjacentHTML('beforeend', `
        <h1 class="title">Törlesztési lefutás</h1>
            <div class="notification">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Dátum</th>
                            <th>Futamidő hónapja</th>
                            <th>Törlesztőrészlet</th>
                            <th>Kamatláb</th>
                            <th>Kamatrész</th>
                            <th>Tőkerész</th>
                            <th>Fennálló tartozás</th>
                            <th>Kamattámogatás</th>
                            <th>Kezességvállalási díj</th>
                        </tr>
                    </thead>
                    <tbody id="tablebody">
                    </tbody>
                </table>
            </div>`);
        const tbody = document.getElementById("tablebody");
        if (tbody) {
            this.DueDates.forEach(element => {
                tbody.insertAdjacentHTML('beforeend', element.HTMLstring);
            });
        }
    }

    public Prolong(by: number) {
        this.ProlongedTerm += by;
    }

    private CalculateProlongedDueDates() {
        for (let index = this.Term; index < this.ProlongedTerm + 1; index++) {
            let tempduedate = new LoanDueDate(this);
            tempduedate.IsFirst = false;
            tempduedate.PaymentType = LoanPaymentType.Annuity //Babavárónál alapból NoInterest
            tempduedate.TermNumber = index;
            let tempdate = this.MomentDate.clone();
            tempdate.add(index, 'months');
            tempdate.set('date', this.DueDay);
            tempduedate.Date = FindNextWorkingDayService.GetInstance().FindNextWorkingDay(tempdate).toDate();
            this.DueDates[index] = tempduedate;
            this.DueDates[index].Calculate();
        }
    }

    private Calculate() {
        const firstduedate = new LoanDueDate(this);
        firstduedate.IsFirst = true;
        firstduedate.Balance = new Decimal(this.LoanAmount);
        firstduedate.Date = this.StartDate;
        firstduedate.PaymentType = LoanPaymentType.Annuity;
        firstduedate.TermNumber = 0; //folyósítás=nulladik esedékesség
        firstduedate.IsSuspended = false;
        firstduedate.Calculate();

        this.DueDates = new Array<LoanDueDate>();
        this.DueDates[0] = firstduedate;

        for (let index = 1; index < this.Term + 1; index++) {

            let tempduedate = new LoanDueDate(this);
            tempduedate.IsFirst = false;
            tempduedate.PaymentType = LoanPaymentType.Annuity //Babavárónál alapból NoInterest, ezt az interestcalculatorservice állítja át
            tempduedate.TermNumber = index;
            let tempdate = this.MomentDate.clone();
            tempdate.add(index, 'months');
            tempdate.set('date', this.DueDay);
            tempduedate.Date = FindNextWorkingDayService.GetInstance().FindNextWorkingDay(tempdate).toDate();
            this.DueDates[index] = tempduedate;
            this.DueDates[index].Calculate();
        }
        this.CalculateProlongedDueDates();
        this.APR = APRCalculatorService.GetInstance().CalcAPR(this);
    }
}