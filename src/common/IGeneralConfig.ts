import ICurrency from "./ICurrency";
import ITimezone from "./ITimezone";

  export default interface IGeneralConfig {
    currencies: Array<ICurrency>,
    timezones: Array<ITimezone>
  }