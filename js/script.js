function addCommas(nStr) {
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

function timeConvert(nStr) {
	var seconds=(nStr/1000)%60, minutes=(nStr/(1000*60))%60, hours=(nStr/(1000*60*60))%24;
	return cleanUpTime(hours)+":"+ cleanUpTime(minutes)+":"+ cleanUpTime(seconds);
}

function cleanUpTime(number) {
     return (parseInt(number) < 10 ? '0' : '') + parseInt(number); 
}




















