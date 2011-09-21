var zoneinfo = require(__dirname+'/index'),
    TZDate = zoneinfo.TZDate;

exports["date 1: basics"] = function (test){
    var d = new TZDate("2010-09-21T03:18:23.000Z");
    
    test.strictEqual(d.toString(), "2010-09-21 03:18:23 GMT", "toString");
    test.strictEqual(d.format("Y-m-d"), "2010-09-21", "basic format");
    test.strictEqual(d.getTimezone(), "UTC", "getTimezone");
    test.strictEqual(d.getTimezone(true), "Etc/UTC", "getTimezone long");
    
    d.setTimezone("America/Denver");
    test.strictEqual(d.toString(), "2010-09-20 21:18:23 GMT-0600", "changing timezone toString");
    test.strictEqual(d.getTimezone(), "MDT", "changing timezone getTimezone");
    
    d.setTimezone("America/Phoenix");
    test.strictEqual(d.toString(), "2010-09-20 20:18:23 GMT-0700", "changing timezone toString 2");
    test.strictEqual(d.getTimezone(), "MST", "changing timezone getTimezone 2");
    
    test.done();
};

exports["date 2: advanced"] = function (test){
    zoneinfo.setDefaultTimezone("America/New_York");
    
    var d = new TZDate("2010-11-08T16:00:00.000Z");
    test.strictEqual(d.toString(), "2010-11-08 11:00:00 GMT-0500", "default timezone toString");
    test.strictEqual(d.getTimezone(), "EST", "default timezone getTimezone");
    test.strictEqual(d.getTimezone(true), "America/New_York", "default timezone getTimezone long");
    
    test.done();    
};

exports["date3: more advanced"] = function (test){
    var d = new TZDate("05-20-1983 3:37 pm", "America/New_York");
    test.strictEqual(d.toString(), "1983-05-20 15:37:00 GMT-0400", "timezone string locality");
    d.setTimezone("America/Los_Angeles");
    test.strictEqual(d.toString(), "1983-05-20 12:37:00 GMT-0700", "timezone string locality after setTimezone");

    d = new TZDate("5-20-1983 15:37", "America/Chicago");
    test.strictEqual(d.toString(), "1983-05-20 15:37:00 GMT-0500", "timezone string locality 2");
    d.setTimezone("America/Los_Angeles");
    test.strictEqual(d.toString(), "1983-05-20 13:37:00 GMT-0700", "timezone string locality after setTimezone 2");

    test.done();
}

exports["timezones"] = function (test){
    var us_timezones =  ["America/Adak",
                         "America/Anchorage",
                         "America/Boise",
                         "America/Chicago",
                         "America/Denver",
                         "America/Detroit",
                         "America/Indiana/Indianapolis",
                         "America/Indiana/Knox",
                         "America/Indiana/Marengo",
                         "America/Indiana/Petersburg",
                         "America/Indiana/Tell_City",
                         "America/Indiana/Vevay",
                         "America/Indiana/Vincennes",
                         "America/Indiana/Winamac",
                         "America/Juneau",
                         "America/Kentucky/Louisville",
                         "America/Kentucky/Monticello",
                         "America/Los_Angeles",
                         "America/Menominee",
                         "America/Metlakatla",
                         "America/New_York",
                         "America/Nome",
                         "America/North_Dakota/Beulah",
                         "America/North_Dakota/Center",
                         "America/North_Dakota/New_Salem",
                         "America/Phoenix",
                         "America/Shiprock",
                         "America/Sitka",
                         "America/Yakutat",
                         "Pacific/Honolulu"];
                        
    test.strictEqual(JSON.stringify(zoneinfo.listTimezones("US").sort()), JSON.stringify(us_timezones), "US timezone list");
    
    test.strictEqual(zoneinfo.listTimezones().length, 519, "Full timezone list");
    
    test.done();

};

exports["formatting"] = function (test){
    var d = new TZDate("2010-09-21T03:18:23.000Z");
    var e = new TZDate("2010-10-01T14:31:01.001Z");
    var f = new TZDate("2010-10-01T00:31:01.001Z");
    d.setTimezone("Etc/UTC");
    e.setTimezone("Etc/UTC");
    f.setTimezone("Etc/UTC");
    
    test.strictEqual(d.format("Y"), "2010", "format - Y");
    test.strictEqual(d.format("m"), "09", "format - m");
    test.strictEqual(e.format("m"), "10", "format - m 2");
    test.strictEqual(d.format("n"), "9", "format - n");
    test.strictEqual(e.format("n"), "10", "format - n 2");
    test.strictEqual(d.format("d"), "21", "format - d");
    test.strictEqual(e.format("d"), "01", "format - d 2");
    test.strictEqual(d.format("j"), "21", "format - j");
    test.strictEqual(e.format("j"), "1", "format - j 2");
    test.strictEqual(d.format("F"), "September", "format - F");
    test.strictEqual(e.format("F"), "October", "format - F 2");
    test.strictEqual(d.format("M"), "Sep", "format - M");
    test.strictEqual(e.format("M"), "Oct", "format - M 2");
    test.strictEqual(d.format("l"), "Tuesday", "format - l");
    test.strictEqual(e.format("l"), "Friday", "format - l 2");
    test.strictEqual(d.format("D"), "Tue", "format - D");
    test.strictEqual(e.format("D"), "Fri", "format - D 2");
    test.strictEqual(d.format("H"), "03", "format - H");
    test.strictEqual(e.format("H"), "14", "format - H 2");
    test.strictEqual(d.format("h"), "03", "format - h");
    test.strictEqual(e.format("h"), "02", "format - h 2");
    test.strictEqual(f.format("h"), "12", "format - h 3");
    test.strictEqual(d.format("G"), "3", "format - G");
    test.strictEqual(e.format("G"), "14", "format - G 2");
    test.strictEqual(d.format("g"), "3", "format - g");
    test.strictEqual(e.format("g"), "2", "format - g 2");
    test.strictEqual(f.format("g"), "12", "format - g 3");
    test.strictEqual(d.format("i"), "18", "format - i");
    test.strictEqual(e.format("i"), "31", "format - i 2");
    test.strictEqual(d.format("s"), "23", "format - s");
    test.strictEqual(e.format("s"), "01", "format - s 2");
    test.strictEqual(d.format("A"), "AM", "format - A");
    test.strictEqual(e.format("A"), "PM", "format - A 2");
    test.strictEqual(d.format("a"), "am", "format - a");
    test.strictEqual(e.format("a"), "pm", "format - a 2");
    test.strictEqual(d.format("T"), "UTC", "format - T");
    test.strictEqual(e.format("T"), "UTC", "format - T 2");
    test.strictEqual(d.format("t"), "Etc/UTC", "format - t");
    test.strictEqual(e.format("t"), "Etc/UTC", "format - t 2");
    test.strictEqual(d.format("O"), "+0000", "format - O");
    test.strictEqual(e.format("O"), "+0000", "format - O 2");
    
    test.done();
};

exports["issue 2"] = function (test){
    var t1 = function (){
        var local_date = new TZDate(Date.now());
        local_date.setTimezone("America/Chicago");
    }

    test.doesNotThrow(t1);

    test.done();
};
