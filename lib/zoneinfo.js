Date._zoneinfo_path = Date._zoneinfo_path || "/usr/share/zoneinfo/";
Date._zoneinfo_listcache = Date._zoneinfo_listcache || {};
Date._zoneinfo_cache = Date._zoneinfo_cache || {};

Date.prototype._zoneinfo_default = Date.prototype._zoneinfo_default || "Etc/UTC";

Date.prototype._set_zoneinfo = function (zoneinfo){
    this._zoneinfo = zoneinfo;
};

Date.prototype.setTimezone = function (timezone){
    if (Date._zoneinfo_cache[timezone])
    {
        this._set_zoneinfo(Date._zoneinfo_cache[timezone]);
    }
    else
    {
        var zoneinfo = Date.parseZonefile(Date._zoneinfo_path + timezone);
        Date._zoneinfo_cache[timezone] = zoneinfo;
        this._set_zoneinfo(zoneinfo);
    }
    
    this._offset_dt = null;
};

Date.prototype._applyOffset = function (force){
    if (this._offset_dt && !force) return this._offset_dt;
    else
    {
        var tzinfo = this._zoneinfo;
        if (!tzinfo)
        {
            if (this._zoneinfo_default)
            {
                this.setTimezone(this._zoneinfo_default);
                tzinfo = this._zoneinfo;
            }
            else
            {
                return false;
            }
        }
        
        var timestamp = this.getTime() + (this._utcoffset(true) * 60 * 60 * 1000);
        this._offset_dt = new Date();
        this._offset_dt.setTime(timestamp);
        return this._offset_dt;
    }
};

Date.prototype.getTimezone = function (){
    this._applyOffset();
    if (this._zoneinfo)
    {
        var sys = require('sys');
        sys.debug(this._dst());
        var tz = this._tzname();
        return this._dst() != 0 ? tz.replace("S","D") : tz;
    }
    else
    {
        return "";
    }
};

Date.prototype._zeropad = function (value, pad){
    if (!pad) return value;
    
    value += "";
    if (value == "") return "00";
    if (value.length < 2) return "0"+value;
    return value; 
};

Date.prototype._find_ttinfo = function (laststd, fromApplyOffset){
    if (!fromApplyOffset) this._applyOffset();
    var tz = this._zoneinfo;
    var timestamp = (this.getTime()+"").substring(-3) + 0,
        idx = 0;
    
    var found = false;
    for (var i in tz.trans_list)
    {
        if (timestamp < tz.trans_list[i])
        {
            found = true;
            break;
        }
        idx++;
    }
    
    if (!found) return tz.ttinfo_std;
    if (idx == 0) return tz.ttinfo_before;
    
    if (laststd)
    {
        while (idx > 0){
            var tti = tz.trans_idx[idx - 1];
            if (!tti.isdst) return tti;
            idx--;
        }
        
        return tz.ttinfo_std;
    }
    else return tz.trans_idx[idx - 1];
};

Date.prototype._utcoffset = function (fromApplyOffset){
    if (!fromApplyOffset) this._applyOffset();
    var tz = this._zoneinfo;
    
    if (!tz.ttinfo_std) return 0;
    else return this._find_ttinfo(false, true).offset;
};

Date.prototype._dst = function (){
    this._applyOffset();
    var tz = this._zoneinfo;
    
    if (!tz.ttinfo_dst) return 0;
    var tti = this._find_ttinfo();
    if (!tti.isdst) return 0;
    
    return tti.offset - this._find_ttinfo(1).offset;
};

Date.prototype._tzname = function (){
    this._applyOffset();
    var tz = this._zoneinfo;

    if (!tz.ttinfo_std) return null;
    return this._find_ttinfo().abbr;
};

['getDate','getDay','getFullYear','getHours','getMilliseconds',
        'getMinutes','getMonth','getSeconds'].forEach(function (func){
    var type = func.substring(3);
    var realfunc = "getUTC"+type;
    Date.prototype["getTZ"+type] = function (zeropad){
        this._applyOffset();
        if (this._zoneinfo)
        {
            if (type == "Month")
                return this._zeropad(this._applyOffset()[realfunc]() + 1, zeropad);
            else
                return this._zeropad(this._applyOffset()[realfunc](), zeropad);
        }
        else
        {
            if (type == "Month")
                return this._zeropad(this[realfunc](), zeropad);
            else
                return this._zeropad(this[realfunc](), zeropad);
        }
    };
});

Date.prototype.toTZString = function (sep){
    sep = sep || "-";
    return this.getTZFullYear()+sep+this.getTZMonth(true)+sep+this.getTZDate(true)
            +" "+this.getTZHours(true)+":"+this.getTZMinutes(true)+":"+this.getTZSeconds(true)+" "+this.getTimezone();
}

Date.setDefaultZonefile = function (timezone){
    var fs = require('fs');
    var stat = fs.statSync(Date._zoneinfo_path + timezone);
    if (stat.isFile())
    {
        Date.prototype._zoneinfo_default = timezone;
        return true;
    }
    else
    {
        return false;
    }
}

Date.parseZonefile = function (file){
    var fs = require('fs'),
        jspack = require('./jspack/jspack').jspack;
    
    var stat = fs.statSync(file);
    if (stat.isFile())
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
            var _utclocalct = tmp[0];
            // The number of standard/wall indicators stored in the file.
            var _stdwallct = tmp[1];
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
            
            var tzinfo = {
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
            if (_stdwallct)
            {
                _isstd = jspack.Unpack(">"+_stdwallct+"b", buffer.slice(buffer_idx, buffer_idx + _stdwallct));
                buffer_idx += _stdwallct;
            }
            
            
            // Finally, there are tzh_ttisgmtcnt UTC/local
            // indicators, each stored as a one-byte value;
            // they tell whether the transition times associated
            // with local time types were specified as UTC or
            // local time, and are used when a time zone file
            // is used in handling POSIX-style time zone envi-
            // ronment variables.
            var _isgmt = null;
            if (_utclocalct)
            {
                _isgmt = jspack.Unpack(">"+_utclocalct+"b", buffer.slice(buffer_idx, buffer_idx + _utclocalct));
                buffer_idx += _utclocalct;
            }
            
            
            //finished reading
            
            tzinfo.ttinfo_list = [];
            _ttinfo.forEach(function (item, index){
                item[0] = Math.floor((item[0] + 30) / (60*60));
                
                tzinfo.ttinfo_list.push({
                    offset: item[0],
                    isdst: item[1],
                    abbr: _abbr.slice(item[2], _abbr.indexOf('\x00',item[2])),
                    isstd: _stdwallct > index && _isstd[index] != 0,
                    isgmt: _utclocalct > index && _isgmt[index] != 0
                });
            });
            
            // Replace ttinfo indexes for ttinfo objects.
            tzinfo.trans_idx = tzinfo.trans_idx.map(function (item){ return tzinfo.ttinfo_list[item]; });
            
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
                    for (var i = _timect - 1; i > -1; i--)
                    {
                        var tti = tzinfo.trans_idx[i];
                        if (!tzinfo.ttinfo_std && !tti.isdst)
                            tzinfo.ttinfo_std = tti;
                        else if (!tzinfo.ttinfo_dst && tti.isdst)
                            tzinfo.ttinfo_dst = tti;
                        
                        if (tzinfo.ttinfo_dst && tzinfo.ttinfo_std)
                            break;
                    }
                    
                    if (tzinfo.ttinfo_dst && !tzinfo.ttinfo_std)
                        tzinfo.ttinfo_std = tzinfo.ttinfo_dst
                        
                    for (var i in tzinfo.ttinfo_list)
                    {
                        if (!tzinfo.ttinfo_list[i].isdst)
                        {
                            tzinfo.ttinfo_before = tzinfo.ttinfo_list[i];
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

Date.listZonefiles = function (area, force){
    area = area || "";
    
    if (Date._zoneinfo_listcache[area || "_"] && !force){
        return Date._zoneinfo_list_cache[area || "_"];
    }
    
    var fs = require('fs');
    
    var path = Date._zoneinfo_path + area;
    var stat = fs.statSync(path);
    if (stat.isDirectory())
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
        
        Date._zoneinfo_listcache[area || "_"] = retlist;
        
        return retlist;
    }
    else
    {
        return false;
    }
}
