const fs = require('fs');
const path = require('path');

// Read the timezones.json file
const timezonesPath = path.join(__dirname, 'src', 'assets', 'timezones.json');
const timezones = JSON.parse(fs.readFileSync(timezonesPath, 'utf8'));

// Define date format rules based on region/country
const getDateFormat = (timezoneName, countryCode) => {
  // MM/dd/yyyy countries/regions
  if (
    countryCode === 'US' ||  // United States
    countryCode === 'CA' ||  // Canada (though some use dd/MM/yyyy)
    countryCode === 'PH' ||  // Philippines
    timezoneName.startsWith('America/') && (
      timezoneName.includes('New_York') ||
      timezoneName.includes('Chicago') ||
      timezoneName.includes('Denver') ||
      timezoneName.includes('Los_Angeles') ||
      timezoneName.includes('Anchorage') ||
      timezoneName.includes('Honolulu')
    )
  ) {
    return 'MM/dd/yyyy';
  }
  
  // yyyy/MM/dd countries/regions
  if (
    countryCode === 'JP' ||  // Japan
    countryCode === 'KR' ||  // South Korea  
    countryCode === 'CN' ||  // China
    countryCode === 'KP' ||  // North Korea
    countryCode === 'MN' ||  // Mongolia
    timezoneName.startsWith('Asia/Tokyo') ||
    timezoneName.startsWith('Asia/Seoul') ||
    timezoneName.startsWith('Asia/Shanghai') ||
    timezoneName.startsWith('Asia/Beijing') ||
    timezoneName.startsWith('Asia/Pyongyang') ||
    timezoneName.startsWith('Asia/Ulaanbaatar')
  ) {
    return 'yyyy/MM/dd';
  }
  
  // Default to dd/MM/yyyy for most other countries
  // This includes Europe, most of Asia, Africa, Oceania
  return 'dd/MM/yyyy';
};

// Update each timezone entry
timezones.forEach(country => {
  country.timezones.forEach(timezone => {
    timezone.popular_format = getDateFormat(timezone.name, country.code);
  });
});

// Write the updated data back to the file
fs.writeFileSync(timezonesPath, JSON.stringify(timezones, null, 2));

console.log('✅ Successfully updated timezones.json with popular_format field');
console.log('📊 Statistics:');

// Count formats
const formatCounts = {};
timezones.forEach(country => {
  country.timezones.forEach(timezone => {
    formatCounts[timezone.popular_format] = (formatCounts[timezone.popular_format] || 0) + 1;
  });
});

console.log('Format distribution:');
Object.entries(formatCounts).forEach(([format, count]) => {
  console.log(`  ${format}: ${count} timezones`);
});
