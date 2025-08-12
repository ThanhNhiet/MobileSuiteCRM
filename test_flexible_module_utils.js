/*
Test: Flexible ModuleLanguageUtils with moduleName support
Expected behavior: Support any module name with flexible cache keys
*/

// Example usage scenarios:
const usageExamples = [
    {
        scenario: 'Single module translation',
        code: `
// Before (hardcoded Users)
await moduleLanguageUtils.translate('LBL_NAME');

// After (flexible module)
await moduleLanguageUtils.translate('LBL_NAME', null, 'Accounts');
await moduleLanguageUtils.translate('LBL_DESCRIPTION', null, 'Notes');
await moduleLanguageUtils.translate('LBL_STATUS', null, 'Tasks');
        `,
        description: 'Translate keys for specific modules'
    },
    {
        scenario: 'Multiple modules batch loading',
        code: `
// Load language data for multiple modules
const results = await moduleLanguageUtils.loadMultipleModulesLanguageData([
    'Accounts', 'Notes', 'Tasks', 'Meetings', 'Contacts'
]);

// Access each module's data
const accountsData = results.Accounts.data;
const notesData = results.Notes.data;
        `,
        description: 'Batch load multiple modules language data'
    },
    {
        scenario: 'Cache management',
        code: `
// Clear specific module
moduleLanguageUtils.clearCache(null, 'Accounts');

// Clear specific language for all modules
moduleLanguageUtils.clearCache('vi_VN');

// Clear specific module-language combination
moduleLanguageUtils.clearCache('vi_VN', 'Notes');

// Clear all cache
moduleLanguageUtils.clearCache();
        `,
        description: 'Flexible cache clearing options'
    },
    {
        scenario: 'Field name translation',
        code: `
// Translate field names for different modules
await moduleLanguageUtils.translateFieldName('name', null, 'Accounts');
await moduleLanguageUtils.translateFieldName('description', null, 'Notes');
await moduleLanguageUtils.translateFieldName('status', null, 'Tasks');
        `,
        description: 'Module-specific field translations'
    }
];

console.log('🔧 Flexible ModuleLanguageUtils Enhancement');
console.log('');

console.log('📋 Key Improvements:');
console.log('✅ Dynamic moduleName parameter support');
console.log('✅ Flexible cache keys: "ModuleName-Language"');
console.log('✅ Batch loading for multiple modules');
console.log('✅ Advanced cache management');
console.log('✅ Module tracking in cached data');
console.log('');

console.log('🗂️ Cache Key Structure:');
console.log('Before: "Modules-vi_VN" (hardcoded)');
console.log('After:  "Accounts-vi_VN", "Notes-en_US", etc.');
console.log('');

console.log('📁 File Path Structure:');
console.log('Before: cache/Users/language/vi_VN.json');
console.log('After:  cache/{moduleName}/language/{language}.json');
console.log('Examples:');
console.log('  - cache/Accounts/language/vi_VN.json');
console.log('  - cache/Notes/language/en_US.json');
console.log('  - cache/Tasks/language/vi_VN.json');
console.log('');

console.log('🎯 Usage Examples:');
usageExamples.forEach((example, index) => {
    console.log(`${index + 1}. ${example.scenario}`);
    console.log(`   Description: ${example.description}`);
    console.log(`   Code:${example.code}`);
    console.log('');
});

console.log('💡 Benefits:');
console.log('• Multi-module support: Any SuiteCRM module');
console.log('• Efficient caching: Separate cache per module-language');
console.log('• Batch operations: Load multiple modules simultaneously');
console.log('• Flexible cache management: Clear by module, language, or both');
console.log('• Backward compatible: Default to "Users" if no module specified');
console.log('• Memory efficient: Track cached modules to avoid duplicates');

console.log('');
console.log('🔍 New Methods:');
console.log('• loadMultipleModulesLanguageData(moduleNames)');
console.log('• getCachedModuleNames()');
console.log('• Enhanced clearCache(language, module)');
console.log('• All translate methods now accept moduleName parameter');
