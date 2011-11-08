var zoneinfo = require(__dirname+'/../index'),
    TZDate = zoneinfo.TZDate;

exports["date 1: basics"] = function (beforeExit, assert){
    var d = new TZDate("2010-09-21T03:18:23.000Z");

    assert.eql(d.toString(), "2010-09-21 03:18:23 GMT", "toString");
    assert.eql(d.format("Y-m-d"), "2010-09-21", "basic format");
    assert.eql(d.getTimezone(), "UTC", "getTimezone");
    assert.eql(d.getTimezone(true), "Etc/UTC", "getTimezone long");

    d.setTimezone("America/Denver");
    assert.eql(d.toString(), "2010-09-20 21:18:23 GMT-0600", "changing timezone toString");
    assert.eql(d.getTimezone(), "MDT", "changing timezone getTimezone");

    d.setTimezone("America/Phoenix");
    assert.eql(d.toString(), "2010-09-20 20:18:23 GMT-0700", "changing timezone toString 2");
    assert.eql(d.getTimezone(), "MST", "changing timezone getTimezone 2");


};

exports["date 2: advanced"] = function (beforeExit, assert){
    zoneinfo.setDefaultTimezone("America/New_York");

    var d = new TZDate("2010-11-08T16:00:00.000Z");
    assert.eql(d.toString(), "2010-11-08 11:00:00 GMT-0500", "default timezone toString");
    assert.eql(d.getTimezone(), "EST", "default timezone getTimezone");
    assert.eql(d.getTimezone(true), "America/New_York", "default timezone getTimezone long");


};

exports["date3: more advanced"] = function (beforeExit, assert){
    var d = new TZDate("05-20-1983 3:37 pm", "America/New_York");
    assert.eql(d.toString(), "1983-05-20 15:37:00 GMT-0400", "timezone string locality");
    d.setTimezone("America/Los_Angeles");
    assert.eql(d.toString(), "1983-05-20 12:37:00 GMT-0700", "timezone string locality after setTimezone");

    d = new TZDate("5-20-1983 15:37", "America/Chicago");
    assert.eql(d.toString(), "1983-05-20 15:37:00 GMT-0500", "timezone string locality 2");
    d.setTimezone("America/Los_Angeles");
    assert.eql(d.toString(), "1983-05-20 13:37:00 GMT-0700", "timezone string locality after setTimezone 2");


}

exports["timezones"] = function (beforeExit, assert){
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

    assert.eql(JSON.stringify(zoneinfo.listTimezones("US").sort()), JSON.stringify(us_timezones), "US timezone list");

    assert.eql(zoneinfo.listTimezones().length, 523, "Full timezone list");



};

exports["formatting"] = function (beforeExit, assert){
    var d = new TZDate("2010-09-21T03:18:23.000Z");
    var e = new TZDate("2010-10-01T14:31:01.001Z");
    var f = new TZDate("2010-10-01T00:31:01.001Z");
    var g = new TZDate("2010-10-01T12:31:01.001Z");
    d.setTimezone("Etc/UTC");
    e.setTimezone("Etc/UTC");
    f.setTimezone("Etc/UTC");
    g.setTimezone("Etc/UTC");

    assert.eql(d.format("Y"), "2010", "format - Y");
    assert.eql(d.format("m"), "09", "format - m");
    assert.eql(e.format("m"), "10", "format - m 2");
    assert.eql(d.format("n"), "9", "format - n");
    assert.eql(e.format("n"), "10", "format - n 2");
    assert.eql(d.format("d"), "21", "format - d");
    assert.eql(e.format("d"), "01", "format - d 2");
    assert.eql(d.format("j"), "21", "format - j");
    assert.eql(e.format("j"), "1", "format - j 2");
    assert.eql(d.format("F"), "September", "format - F");
    assert.eql(e.format("F"), "October", "format - F 2");
    assert.eql(d.format("M"), "Sep", "format - M");
    assert.eql(e.format("M"), "Oct", "format - M 2");
    assert.eql(d.format("l"), "Tuesday", "format - l");
    assert.eql(e.format("l"), "Friday", "format - l 2");
    assert.eql(d.format("D"), "Tue", "format - D");
    assert.eql(e.format("D"), "Fri", "format - D 2");
    assert.eql(d.format("H"), "03", "format - H");
    assert.eql(e.format("H"), "14", "format - H 2");
    assert.eql(d.format("h"), "03", "format - h");
    assert.eql(e.format("h"), "02", "format - h 2");
    assert.eql(f.format("h"), "12", "format - h 3");
    assert.eql(g.format("h"), "12", "format - h 4");
    assert.eql(d.format("G"), "3", "format - G");
    assert.eql(e.format("G"), "14", "format - G 2");
    assert.eql(d.format("g"), "3", "format - g");
    assert.eql(e.format("g"), "2", "format - g 2");
    assert.eql(f.format("g"), "12", "format - g 3");
    assert.eql(g.format("g"), "12", "format - g 4");
    assert.eql(d.format("i"), "18", "format - i");
    assert.eql(e.format("i"), "31", "format - i 2");
    assert.eql(d.format("s"), "23", "format - s");
    assert.eql(e.format("s"), "01", "format - s 2");
    assert.eql(d.format("A"), "AM", "format - A");
    assert.eql(e.format("A"), "PM", "format - A 2");
    assert.eql(d.format("a"), "am", "format - a");
    assert.eql(e.format("a"), "pm", "format - a 2");
    assert.eql(d.format("T"), "UTC", "format - T");
    assert.eql(e.format("T"), "UTC", "format - T 2");
    assert.eql(d.format("t"), "Etc/UTC", "format - t");
    assert.eql(e.format("t"), "Etc/UTC", "format - t 2");
    assert.eql(d.format("O"), "+0000", "format - O");
    assert.eql(e.format("O"), "+0000", "format - O 2");


};

exports["issue 2"] = function (beforeExit, assert){
    var t1 = function (){
        var local_date = new TZDate(Date.now());
        local_date.setTimezone("America/Chicago");
    }

    var noThrow = true;

    try {
        t1()
    }
    catch (ex) {
        noThrow = false;
    }

    assert.eql(noThrow, true, "timestamp passing")

};
