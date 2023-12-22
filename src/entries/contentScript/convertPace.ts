import { KM_TO_MILES, MILES_TO_KM } from "../consts/conversions";

/**
 * Convert Pace from min /km to min/mile
 * @param value the string pace provided e.g. 6:40 which means 6 mintutes, 40 s
 * @param unit either kilometers or miles
 * @returns a formatted string in the same syntax as value, but converted
 */
export const convertPace = (value: string, unit: "kilometers" | "miles") => {
  const conversion = unit === "miles" ? MILES_TO_KM : KM_TO_MILES;

  const splitValue = value.split(":");

  const seconds = splitValue.at(-1);
  const minutes = splitValue.at(-2);

  const totalMinutes = +minutes! + +seconds! / 60;
  const oldUnitPerHour = 60 / totalMinutes;
  const newUnitPerHour = oldUnitPerHour * conversion;
  const minutesPerMile = 60 / newUnitPerHour;

  const [min, second] = String(minutesPerMile).split(".");
  const secondOutput = String(+second * 60).substring(0, 2);

  return `${min}:${secondOutput}`;
};
