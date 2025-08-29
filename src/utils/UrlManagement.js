//export local host ip
const LOCALHOST_IP_Vuong = 'http://192.168.10.183/suitecrm7';
const LOCALHOST_IP_nhiet = 'http://192.168.101.7/suitecrm7';
const LOCALHOST_IP_CTY = 'http://192.168.10.192/suitecrm7';


let dynamicUrl = LOCALHOST_IP_Vuong; // Giá trị mặc định

export function getUrl() {
	return dynamicUrl;
}

export function setUrl(newUrl) {
	dynamicUrl = newUrl;
}

