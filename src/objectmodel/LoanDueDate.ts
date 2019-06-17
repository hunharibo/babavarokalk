import Loan from './Loan';
import { LoanPaymentType } from './Common';
import InterestCalculatorService from '../service/InterestCalculatorService';
import BabavaroPrincipalService from '../service/BabavaroPrincipalService';
import Globals from '.././config.json';
import BabavaroGuaranteeService from '../service/BabavaroGuaranteeService';
import BabavaroSuspensionService from '../service/BabavaroSuspensionService';
import { Decimal } from 'decimal.js';
import InstalmentCalculatorService from '../service/InstalmentCalculatorService';
import BabavaroInterestSubsidyService from '../service/BabavaroInterestSubsidyService';
import moment, { Moment } from 'moment';

export default class LoanDueDate {
    public Date: Date;
    public Principal: Decimal;
    public Interest: Decimal;
    public InterestRate: Decimal;
    public Instalment: Decimal;
    public Balance: Decimal;
    public TermNumber: number;
    public PaymentType: LoanPaymentType;
    public IsFirst: boolean;
    public OwnerLoan: Loan;
    public HTMLstring: string;
    public InterestSubsidy: Decimal;
    public GuaranteeFee: Decimal;
    public IsSuspended: boolean;
    public maxTerm: number;
    public HasInterestSubsidy: boolean;
    public DaysSince: Decimal;

    constructor(owner: Loan) {
        this.OwnerLoan = owner;
        this.maxTerm = owner.Term;
    }

    private ConstructHTML() {
        //Html reprezentáció
        this.HTMLstring = `
        <tr>
            <td>${this.Date.toLocaleDateString()}</td>
            <td>${this.TermNumber}</td>
            <td>${this.Instalment}</td>
            <td>${this.InterestRate}</td>
            <td>${this.Interest}</td>
            <td>${this.Principal}</td>
            <td>${this.Balance}</td>
            <td>${this.InterestSubsidy}</td>
            <td>${this.GuaranteeFee}</td>
        </tr>`
    }

    private CalcDueDate() {
        //ha még maradt tartozás -- csak az első gyerek esetében képzelhető el prolongáció, ezért eleve csak azt vizsgáljuk
        if (this.OwnerLoan.ChildrenBirthTermNumbers[0] &&
            this.OwnerLoan.ChildrenBirthTermNumbers[0].TermIncreaseRequired &&
            this.TermNumber > this.OwnerLoan.ChildrenBirthTermNumbers[0].BirthTermNumber) {
            this.maxTerm += Globals.SuspensionDuration;
            if (this.TermNumber < this.OwnerLoan.ChildrenBirthTermNumbers[0].BirthTermNumber + Globals.SuspensionDuration + 1) this.OwnerLoan.Prolong(1);
        }
        if (this.IsFirst) { //az első (valójában a nulladik) esedékesség a folyósítás, itt még nincs törlesztés.
            this.Interest = new Decimal(0);
            this.Instalment = InstalmentCalculatorService.GetInstance().CalcInstalment(this);
            this.Principal = new Decimal(0);
        }
        else if (this.PaymentType === LoanPaymentType.Annuity && !this.IsFirst) {
            const interestratio = new Decimal(1).sub((new Decimal(1).add(this.InterestRate.dividedBy(12).dividedBy(100))).pow(this.TermNumber - 1 - this.maxTerm)); //magic függvény, ezt jó lenne érteni
            //this.Interest = new Decimal(this.OwnerLoan.DueDates[this.TermNumber - 1].Balance.times(this.InterestRate.dividedBy(12).dividedBy(100))).toDecimalPlaces(0);
            this.Instalment = InstalmentCalculatorService.GetInstance().CalcInstalment(this);
            this.Interest = this.Instalment.times(interestratio).toDecimalPlaces(0);
            this.Principal = this.Instalment.sub(this.Interest);
            this.Balance = this.Balance.sub(this.Principal);
            if (this.TermNumber === Globals.ChildMustBeBornBy + 1 && this.OwnerLoan.ChildrenBirthTermNumbers.length === 0) { //ha nincs gyerek, vissza kell fizetni a kamattámogatást
                const InterestPayback: Decimal = InterestCalculatorService.GetInstance().CalcInterestPayback(this);
                this.Interest = this.Interest.add(InterestPayback);
                this.Instalment = this.Instalment.add(InterestPayback);
            }
        }
        else if (this.PaymentType === LoanPaymentType.NoInterest && !this.IsFirst) {
            this.Interest = new Decimal(0);
            this.Instalment = InstalmentCalculatorService.GetInstance().CalcInstalment(this);
            this.Principal = this.Instalment.sub(this.Interest);
            this.Balance = this.Balance.sub(this.Principal);
        }
    }

    private SuspensionCorrection() {
        if (this.IsSuspended) {
            //Ha felfüggesztett, nincs se törlesztés, se kezelésségvállalási díj
            this.Instalment = new Decimal(0);
            this.Balance = this.Balance.add(this.Principal);
            this.Principal = new Decimal(0);
        }
    }

    public Calculate() {
        //Hány nap telt el az előző esedékesség óta?
        if (this.IsFirst) this.DaysSince = new Decimal(0);
        else if (this.OwnerLoan.DueDates[this.TermNumber - 1]) {
            this.DaysSince = new Decimal(moment(this.Date).diff(moment(this.OwnerLoan.DueDates[this.TermNumber - 1].Date), 'days', true));
        }
        //Felfüggesztett ez az esedékesség?
        BabavaroSuspensionService.GetInstance().CalcSuspension(this);
        //Kamattámogatott időszakban vagyunk?
        BabavaroInterestSubsidyService.GetInstance().CalcHasSubsidy(this);
        //Először számoljuk ki a kamatlábat (egy esedékesség kiszámításához minimum egy futamidő, egyenleg és kamatláb szükséges, ebből már lehet dolgozni)
        this.InterestRate = InterestCalculatorService.GetInstance().CalcInterestRate(this);
        //Aztán számoljuk el a babaváró támogatást a gyerekszületések alapján
        if (!this.IsFirst) this.Balance = this.OwnerLoan.DueDates[this.TermNumber - 1].Balance.sub(BabavaroPrincipalService.GetInstance().CalcPrincipalSubsidy(this));
        //Előtörlesztések számítása TODO, még nincs rá lehetőség, új funkció lenne: ügyfél által beállítható tetszőleges előtörlesztés miatt újraszámítás
        //Ha az előtörlesztések és babaváró támogatások jóváírása után már nem maradt tartozás, akkor le kell zárni a lefutást.
        if (this.Balance.toNumber() === 0 && !this.OwnerLoan.EarlyClosureInTermNumber) {
            this.Instalment = new Decimal(0);
            this.Principal = new Decimal(0);
            this.Balance = new Decimal(0);
            this.Interest = new Decimal(0);
            this.OwnerLoan.EarlyClosureInTermNumber = this.TermNumber;
        }
        //Előtörlesztés utáni időszakot ki kell nullázni, itt már nem él a hitel.
        if(this.OwnerLoan.EarlyClosureInTermNumber && this.OwnerLoan.EarlyClosureInTermNumber>0){
            this.Instalment = new Decimal(0);
            this.Principal = new Decimal(0);
            this.Balance = new Decimal(0);
            this.Interest = new Decimal(0);
        }
        //Ha még van tartozás, akkor számolunk
        else this.CalcDueDate();

        //kezességvállalási díj kalk.
        this.GuaranteeFee = BabavaroGuaranteeService.GetInstance().CalcGuaranteeFee(this);
        //Felfüggesztés vizsgálat
        this.SuspensionCorrection();
        //ez az utolsó lépés!
        this.ConstructHTML();
    }
}