// generate-full-timezones.js
import ct from "countries-and-timezones";
import fs from "fs";

const countries = ct.getAllCountries();
const result = [];

for (const code in countries) {
  const country = countries[code];
  const timezones = country.timezones || [];

  const tzData = timezones.map(tzName => {
    const tz = ct.getTimezone(tzName);
    return {
      name: tz.name,
      utc: tz.utcOffsetStr,
    };
  });

  result.push({
    code: code,
    country: country.name,
    timezones: tzData,
  });
}

fs.writeFileSync("full-timezones.json", JSON.stringify(result, null, 2));
console.log("✅ File full-timezones.json đã được tạo!");
