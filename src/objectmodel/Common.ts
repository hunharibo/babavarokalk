export enum LoanPaymentType {
    Linear = "Lineáris",
    Annuity = "Annuitás",
    NoInterest = "Kamatmentes"
}

export interface IThreadMessage {
    LoanAmount: string;
    Term: string;
    APR: string;
    FirstInstalment: string;
    LastInstalment: string;
    MostCommonInstalment: string;
    FullCost: string;
    LoanCost: string;
}

export enum AprCalcMode {
    FirstDaily = "firstdaily",
    AllDaily = "alldaily",
    NoDaily = "nodaily",
    SubsidyDaily = "subsidydaily"
}

export interface IChildOption {
    BirthTermNumber: number;
    SuspenseRequired: boolean;
    TermIncreaseRequired: boolean;
}

export interface IPrincipalMutationOption {
    TermNumber: number;
    PrincipalAmount: number;
}

export interface ITermMutationOption {
    TermNumber: number;
    NewMaxTerm: number;
}