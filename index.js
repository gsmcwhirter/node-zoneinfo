// This is a class designed to be an alternative to the standard Date objects
// which uses zoneinfo files to determine and adjust between various timezones.

var fs = require('fs'),
    jspack = require('jspack').jspack;

module.exports.TZDate = TZDate;
module.exports.countrycodes = require("./countrycodes");

var _zoneinfo_path = "/usr/share/zoneinfo";
var _zoneinfo_listcache = {};
var _zoneinfo_cache = {};

module.exports.setZoneinfoPath = function (newpath){
    _zoneinfo_path = newpath;
};

module.exports.setDefaultLocalization = function (localization){
    TZDate.prototype._localization = localization;
};

module.exports.setDefaultTimezone = function (timezone){
    var stat = fs.statSync(_zoneinfo_path + "/" + timezone);
    if (stat.isFile())
    {
        TZDate.prototype._zoneinfo_default = timezone;
        return true;
    }
    else
    {
        return false;
    }
}

var isTimezone = module.exports.isTimezone = function (timezone){
    try {
        var stat = fs.statSync(_zoneinfo_path + "/" + timezone);
        return stat.isFile();
    } catch (err) {
        return false;
    }
};

var parseZonefile = function (timezone){

    var file = _zoneinfo_path + "/" + timezone;

    if (isTimezone(timezone))
    {
        var tzinfo = {};
        var buffer = fs.readFileSync(file);

        var buffer_idx = 0;

        // From tzfile(5):
        //
        // The time zone information files used by tzset(3)
        // begin with the magic characters "TZif" to identify
        // them as time zone information files, followed by
        // sixteen bytes reserved for future use, followed by
        // six four-byte values of type long, written in a
        // ``standard'' byte order (the high-order  byte
        // of the value is written first).
        if (buffer.slice(0,4).toString('ascii') != "TZif")
        {
            throw "file format not recognized";
        }
        else
        {
            //ignore 16 bytes
            buffer_idx = 20;
            var tmp = jspack.Unpack(">6l", buffer.slice(buffer_idx, buffer_idx + 24));
            buffer_idx += 24;
            // The number of UTC/local indicators stored in the file.
            var _ttisgmtct = tmp[0];
            // The number of standard/wall indicators stored in the file.
            var _ttisstdct = tmp[1];
            // The number of leap seconds for which data is
            // stored in the file.
            var _leapct = tmp[2];
            // The number of "transition times" for which data
            // is stored in the file.
            var _timect = tmp[3];
            // The number of "local time types" for which data
            // is stored in the file (must not be zero).
            var _typect = tmp[4];
            // The  number  of  characters  of "time zone
            // abbreviation strings" stored in the file.
            var _charct = tmp[5];

            tzinfo = {
                trans_list: null,
                trans_idx: null,
                ttinfo_list: null,
                ttinfo_std: null,
                ttinfo_dst: null,
                ttinfo_before: null
            };

            // The above header is followed by tzh_timecnt four-byte
            // values  of  type long,  sorted  in ascending order.
            // These values are written in ``standard'' byte order.
            // Each is used as a transition time (as  returned  by
            // time(2)) at which the rules for computing local time
            // change.
            if (_timect)
            {
                tzinfo.trans_list = jspack.Unpack(">"+_timect+"l", buffer.slice(buffer_idx, buffer_idx + (_timect * 4)));
                buffer_idx += (_timect * 4)
            }
            else
                tzinfo.trans_list = [];

            // Next come tzh_timecnt one-byte values of type unsigned
            // char; each one tells which of the different types of
            // ``local time'' types described in the file is associated
            // with the same-indexed transition time. These values
            // serve as indices into an array of ttinfo structures that
            // appears next in the file.
            if (_timect)
            {
                tzinfo.trans_idx = jspack.Unpack(">"+_timect+"B", buffer.slice(buffer_idx, buffer_idx + _timect));
                buffer_idx += _timect;
            }
            else
                tzinfo.trans_idx = [];


            // Each ttinfo structure is written as a four-byte value
            // for tt_gmtoff  of  type long,  in  a  standard  byte
            // order, followed  by a one-byte value for tt_isdst
            // and a one-byte  value  for  tt_abbrind.   In  each
            // structure, tt_gmtoff  gives  the  number  of
            // seconds to be added to UTC, tt_isdst tells whether
            // tm_isdst should be set by  localtime(3),  and
            // tt_abbrind serves  as an index into the array of
            // time zone abbreviation characters that follow the
            // ttinfo structure(s) in the file.

            var _ttinfo = [];
            for (var i = 0; i < _typect; i++){
                _ttinfo.push(jspack.Unpack(">lbb", buffer.slice(buffer_idx, buffer_idx + 6)));
                buffer_idx += 6;
            }


            var _abbr = buffer.slice(buffer_idx, buffer_idx + _charct).toString();
            buffer_idx += _charct;


            // Then there are tzh_leapcnt pairs of four-byte
            // values, written in  standard byte  order;  the
            // first  value  of  each pair gives the time (as
            // returned by time(2)) at which a leap second
            // occurs;  the  second  gives the  total  number of
            // leap seconds to be applied after the given time.
            // The pairs of values are sorted in ascending order
            // by time.

            var _leap = null;
            if (_leapct)
            {
                _leap = jspack.Unpack(">"+(_leapct * 2)+"l", buffer.slice(buffer_idx, buffer_idx + (_leapct * 8)));
                buffer_idx += _leapct * 8;
            }


            // Then there are tzh_ttisstdcnt standard/wall
            // indicators, each stored as a one-byte value;
            // they tell whether the transition times associated
            // with local time types were specified as standard
            // time or wall clock time, and are used when
            // a time zone file is used in handling POSIX-style
            // time zone environment variables.
            var _isstd = null;
            if (_ttisstdct)
            {
                _isstd = jspack.Unpack(">"+_ttisstdct+"b", buffer.slice(buffer_idx, buffer_idx + _ttisstdct));
                buffer_idx += _ttisstdct;
            }


            // Finally, there are tzh_ttisgmtcnt UTC/local
            // indicators, each stored as a one-byte value;
            // they tell whether the transition times associated
            // with local time types were specified as UTC or
            // local time, and are used when a time zone file
            // is used in handling POSIX-style time zone envi-
            // ronment variables.
            var _isgmt = null;
            if (_ttisgmtct)
            {
                _isgmt = jspack.Unpack(">"+_ttisgmtct+"b", buffer.slice(buffer_idx, buffer_idx + _ttisgmtct));
                buffer_idx += _ttisgmtct;
            }


            //finished reading

            tzinfo.ttinfo_list = [];
            _ttinfo.forEach(function (item, index){
                item[0] = Math.floor(item[0] / 60);

                tzinfo.ttinfo_list.push({
                    offset: item[0],
                    isdst: item[1],
                    abbr: _abbr.slice(item[2], _abbr.indexOf('\x00',item[2])),
                    isstd: _ttisstdct > index && _isstd[index] != 0,
                    isgmt: _ttisgmtct > index && _isgmt[index] != 0
                });
            });

            // Replace ttinfo indexes for ttinfo objects.
            tzinfo.trans_idx = tzinfo.trans_idx.map(function (item){return tzinfo.ttinfo_list[item];});

            // Set standard, dst, and before ttinfos. before will be
            // used when a given time is before any transitions,
            // and will be set to the first non-dst ttinfo, or to
            // the first dst, if all of them are dst.
            if (tzinfo.ttinfo_list.length)
            {
                if (!tzinfo.trans_list.length)
                    tzinfo.ttinfo_std = tzinfo.ttinfo_first = tzinfo.ttinfo_list[0]
                else
                {
                    for (var j = _timect - 1; j > -1; j--)
                    {
                        var tti = tzinfo.trans_idx[j];
                        if (!tzinfo.ttinfo_std && !tti.isdst)
                            tzinfo.ttinfo_std = tti;
                        else if (!tzinfo.ttinfo_dst && tti.isdst)
                            tzinfo.ttinfo_dst = tti;

                        if (tzinfo.ttinfo_dst && tzinfo.ttinfo_std)
                            break;
                    }

                    if (tzinfo.ttinfo_dst && !tzinfo.ttinfo_std)
                        tzinfo.ttinfo_std = tzinfo.ttinfo_dst

                    for (var k in tzinfo.ttinfo_list)
                    {
                        if (!tzinfo.ttinfo_list[k].isdst)
                        {
                            tzinfo.ttinfo_before = tzinfo.ttinfo_list[k];
                            break;
                        }
                    }

                    if (!tzinfo.ttinfo_before)
                        tzinfo.ttinfo_before = tzinfo.ttinfo_list[0];
                }
            }

            /*# Now fix transition times to become relative to wall time.
            #
            # I'm not sure about this. In my tests, the tz source file
            # is setup to wall time, and in the binary file isstd and
            # isgmt are off, so it should be in wall time. OTOH, it's
            # always in gmt time. Let me know if you have comments
            # about this.
            laststdoffset = 0
            self._trans_list = list(self._trans_list)
            for i in range(len(self._trans_list)):
                tti = self._trans_idx[i]
                if not tti.isdst:
                    # This is std time.
                    self._trans_list[i] += tti.offset
                    laststdoffset = tti.offset
                else:
                    # This is dst time. Convert to std.
                    self._trans_list[i] += laststdoffset
            self._trans_list = tuple(self._trans_list)*/

            return tzinfo;
        }
    }
    else
    {
        return false;
    }
}

module.exports.listTimezones = function (country_code){
    country_code = country_code ? country_code.trim().toUpperCase() : "";

    if (_zoneinfo_listcache[country_code || "_"]){
        return _zoneinfo_listcache[country_code || "_"];
    }

    var path = _zoneinfo_path;
    var stat = fs.statSync(path);
    if (stat.isDirectory())
    {
        if (country_code)
        {
            var buffer = fs.readFileSync(path + "/" + "zone.tab", 'ascii');
            buffer = buffer.split("\n");

            buffer.forEach(function (line){
                if (!line.trim()) return;
                if (line.substring(0,1) == "#") return;

                line = line.split("\t");
                var ccode = line[0].trim().toUpperCase();

                if (!_zoneinfo_listcache[ccode]) _zoneinfo_listcache[ccode] = [];

                if (_zoneinfo_listcache[ccode].indexOf(line[2]) == -1)
                    _zoneinfo_listcache[ccode].push(line[2]);
            });

            return _zoneinfo_listcache[country_code];
        }
        else
        {
            var retlist = [];
            var list = fs.readdirSync(path);

            var root_ignore = ["posix","right","SystemV","US"];

            function descend(parent, list){
                parent = parent ? parent + "/" : "";
                for (var i in list){
                    var stat = fs.statSync(path + "/" + parent + list[i]);
                    if (stat.isDirectory() && (parent || root_ignore.indexOf(list[i]) == -1)){
                        descend(parent + list[i], fs.readdirSync(path + "/" + parent + list[i]).sort());
                    }
                    else if (parent && stat.isFile())
                    {
                        retlist.push(parent + list[i]);
                    }
                }
            }

            descend("", fs.readdirSync(path).sort());

            _zoneinfo_listcache["_"] = retlist;

            return retlist;
        }

    }
    else
    {
        return false;
    }
};

function TZDate(arg, timezone){
    this._zoneinfo = null;
    this._zoneinfo_name = null;

    var _adjust = false;

    //constructor
    if (arg && arg != "now"){
        if (typeof arg.trim != "undefined"){
            arg = arg.trim();
        }

        if (typeof arg != "number" && arg[arg.length - 1] != "Z"){
            _adjust = true;
            this._date = new Date(arg + " Z");
        }
        else {
            this._date = new Date(arg);
        }
    }
    else {
        this._date = new Date();
    }

    this.setTimezone((timezone && isTimezone(timezone)) ? timezone : this._zoneinfo_default);

    if (_adjust){
        this._date.setTime(this._date.getTime() - this._utcoffset() * 60 * 1000);
    }
}

TZDate.prototype._zoneinfo_default = "Etc/UTC";

TZDate.prototype._formats = function (letter){
    var self = this;
    var letters = {
        // Y Full year
        "Y": function (){return self._date.getUTCFullYear();},
        // m zero-padded month number 1-12
        "m": function (){return self._zeropad(self._date.getUTCMonth() + 1);},
        // n month number 1-12
        "n": function (){return self._date.getUTCMonth() + 1;},
        // d zero-padded date number
        "d": function (){return self._zeropad(self._date.getUTCDate());},
        // j date number
        "j": function (){return self._date.getUTCDate();},
        // F full month name
        "F": function (){return self._localization.months[self._date.getUTCMonth()];},
        // M short month name
        "M": function (){return self._localization.months_short[self._date.getUTCMonth()];},
        // l full weekday name
        "l": function (){return self._localization.weekdays[self._date.getUTCDay()];},
        // D short weekday name
        "D": function (){return self._localization.weekdays_short[self._date.getUTCDay()];},
        // H zero-padded 24-hour
        "H": function (){return self._zeropad(self._date.getUTCHours());},
        // h zero-padded 12-hour
        "h": function (){return self._zeropad((self._date.getUTCHours() % 12) || 12);},
        // G 24-hour
        "G": function (){return self._date.getUTCHours();},
        // g 12-hour
        "g": function (){return (self._date.getUTCHours() % 12) || 12;},
        // i zero-padded minutes
        "i": function (){return self._zeropad(self._date.getUTCMinutes());},
        // s zero-padded seconds
        "s": function (){return self._zeropad(self._date.getUTCSeconds());},
        // A upper-case AM/PM
        "A": function (){return self._date.getUTCHours() >= 12 ? "PM" : "AM";},
        // a lower-case am/pm
        "a": function (){return self._date.getUTCHours() >= 12 ? "pm" : "am";},
        // T short timezone
        "T": function (){return self.getTimezone(false);},
        // t full timezone name
        "t": function (){return self.getTimezone(true);},
        // O UTC offset
        "O": function (){
            var offset = parseInt(self._utcoffset());
            var minus = false;
            if (offset < 0)
            {
                minus = true;
                offset = -offset;
            }

            var minutes = offset % 60;
            var hours = (offset - minutes) / 60;
            offset = self._zeropad(hours) + self._zeropad(minutes);
            if (minus) offset = "-"+offset;
            else offset = "+"+offset;

            return offset;
        }
    };

    return letters[letter];
};

TZDate.prototype._localization = {
    weekdays: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    weekdays_short: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    months_short: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
};

TZDate.prototype._resetOffset = function (newtz){
    var old_offset = 0;
    if (this._zoneinfo) old_offset = this._utcoffset();
    this._zoneinfo = newtz;
    this._date.setTime(this._date.getTime() + ((this._utcoffset() - old_offset) * 60 * 1000));
};

TZDate.prototype._zeropad = function (value, len){
    len = len || 2;
    value += "";

    for (var i = value.length; i < len; i++){
        value = "0"+value;
    }

    return value;
};

TZDate.prototype._ttinfo = function (laststd){
    var timestamp = Math.floor(this._date.getTime() / 1000),
        idx = 0,
        found = false;

    for (var i in this._zoneinfo.trans_list){
        if (timestamp < this._zoneinfo.trans_list[i])
        {
            found = true;
            break;
        }
        idx++;
    }

    if (!found) return this._zoneinfo.ttinfo_std;
    if (idx == 0) return this._zoneinfo.ttinfo_before;

    if (laststd)
    {
        while (idx > 0){
            if (!this._zoneinfo.trans_idx[idx - 1].isdst) return this._zoneinfo.trans_idx[idx - 1];
            idx--;
        }

        return this._zoneinfo.ttinfo_std;
    }
    else return this._zoneinfo.trans_idx[idx - 1]

};

TZDate.prototype._utcoffset = function (){
    if (!this._zoneinfo.ttinfo_std) return 0;
    return this._ttinfo().offset;
};

TZDate.prototype._dst = function (){
    if (!this._zoneinfo.ttinfo_dst) return 0;
    var tti = this._ttinfo();
    if (!tti.isdst) return 0;

    return tti.offset - this._ttinfo(1).offset;
};

TZDate.prototype._tzname = function (){
    if (!this._zoneinfo.ttinfo_std) return "";
    return this._ttinfo().abbr;
};

TZDate.prototype.setTimezone = function (timezone){
    if (_zoneinfo_cache[timezone])
    {
        this._resetOffset(_zoneinfo_cache[timezone]);
    }
    else
    {
        var zi = parseZonefile(timezone);
        _zoneinfo_cache[timezone] = zi;
        this._resetOffset(zi);
    }

    this._zoneinfo_name = timezone;
};

TZDate.prototype.getTimezone = function (full_name){
    if (full_name) return this._zoneinfo_name;

    return this._tzname();
};


TZDate.prototype.format = function (fmt_string){
    if (!fmt_string) return this.toString();

    var slashct = 0;
    var arr = fmt_string.split("");
    fmt_string = "";

    var self = this;

    arr.forEach(function (chr, ind){
        if (chr == "\\"){
            slashct++;
            return;
        }

        if (self._formats(chr))
        {
            var realslashes = Math.floor(slashct / 2);
            for (var i = 0; i < realslashes; i++){fmt_string += "\\";}
            if (slashct % 2)
            {
                fmt_string += chr;
            }
            else
            {
                //parse
                fmt_string += self._formats(chr)();
            }

            slashct = 0;
        }
        else
        {
            for (var j = 0; j < slashct; j++){fmt_string += "\\";}
            slashct = 0;
            fmt_string += chr;
        }
    });

    return fmt_string;
};

TZDate.prototype.setLocalization = function (localization){
    this._localization = localization;
};

TZDate.prototype.toString = function (){
    if (this._formats("O")() == "+0000")
        return this.format("Y-m-d H:i:s")+" GMT";
    else
        return this.format("Y-m-d H:i:s \\G\\M\\TO");
};
