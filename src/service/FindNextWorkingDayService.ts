import { Moment } from "moment";
import Holidays from 'date-holidays';

export default class FindNextWorkingDayService {
    private static _instance: FindNextWorkingDayService;
    public static GetInstance(): FindNextWorkingDayService {
        if (this._instance) return this._instance;
        else {
            this._instance = new FindNextWorkingDayService();
            return this._instance;
        }
    }

    private IsWorkingDay(day: Moment): boolean {
        const holidays = new Holidays('HU');
        if (day.isoWeekday() === 6 ||
            day.isoWeekday() === 7 ||
            holidays.isHoliday(day.toDate())) {
            return false;
        }
        else return true;
    }

    public FindNextWorkingDay(date: Moment): Moment {
        let returndate = date.clone();
        while (!this.IsWorkingDay(returndate)) {
            returndate.add(1, 'days');
        }
        return returndate;
    }
}