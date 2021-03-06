/*jslint 
browser: true,
nomen: false,
debug: true,
forin: true,
undef: true,
white: false,
onevar: false 
 */
var sc, jQuery;

/**
 * A library to do url shortening 
 */

/**
 * Constants to refer to services 
 */
/**
 * @constant 
 */
var SPAZCORE_SHORTURL_SERVICE_ISGD	  = 'is.gd';
/**
 * @constant 
 */
var SPAZCORE_SHORTURL_SERVICE_BITLY	  = 'bit.ly';
/**
 * @constant 
 */
var SPAZCORE_SHORTURL_SERVICE_JMP     = 'j.mp';
/**
 * @constant 
 */
var SPAZCORE_SHORTURL_SERVICE_GOOGLE  = 'goo.gl';

/**
 * @constant 
 */
var SPAZCORE_EXPANDABLE_DOMAINS = [
	"bit.ly",
	"cli.gs",
	"digg.com",
	"fb.me",
	"is.gd",
	"j.mp",
	"kl.am",
	"su.pr",
	"tinyurl.com",
	"goo.gl",
	"307.to",
	"adjix.com",
	"b23.ru",
	"bacn.me",
	"bloat.me",
	"budurl.com",
	"clipurl.us",
	"cort.as",
	"dwarfurl.com",
	"ff.im",
	"fff.to",
	"href.in",
	"idek.net",
	"korta.nu",
	"lin.cr",
	"livesi.de",
	"ln-s.net",
	"loopt.us",
	"lost.in",
	"memurl.com",
	"merky.de",
	"migre.me",
	"moourl.com",
	"nanourl.se",
	"om.ly",
	"ow.ly",
	"peaurl.com",
	"ping.fm",
	"piurl.com",
	"plurl.me",
	"pnt.me",
	"poprl.com",
	"post.ly",
	"rde.me",
	"reallytinyurl.com",
	"redir.ec",
	"retwt.me",
	"rubyurl.com",
	"short.ie",
	"short.to",
	"smallr.com",
	"sn.im",
	"sn.vc",
	"snipr.com",
	"snipurl.com",
	"snurl.com",
	"tiny.cc",
	"tinysong.com",
	"togoto.us",
	"tr.im",
	"tra.kz",
	"trg.li",
	"twurl.cc",
	"twurl.nl",
	"u.mavrev.com",
	"u.nu",
	"ur1.ca",
	"url.az",
	"url.ie",
	"urlx.ie",
	"w34.us",
	"xrl.us",
	"yep.it",
	"zi.ma",
	"zurl.ws",
	"chilp.it",
	"notlong.com",
	"qlnk.net",
	"trim.li",
	"url4.eu"
];


/**
 * events raised here 
 */
if (!sc.events) { sc.events = {}; }
sc.events.newShortURLSuccess	= 'newShortURLSuccess';
sc.events.newShortURLFailure	= 'newShortURLFailure';
sc.events.newExpandURLSuccess   = 'recoverLongURLSuccess';
sc.events.newExpandURLFailure   = 'recoverLongURLFailure';


/**
 * Constructor
 * @param {string} service	the name of a service. Preferrably one of the SPAZCORE_SHORTURL_SERVICE_* constants
 * @class SpazShortURL
 * @constructor
 */
function SpazShortURL(service) {
	
	this.api = this.getAPIObj(service);
	
	
	this.expanded_cache = {};
	
}

SpazShortURL.prototype.getAPIObj = function(service) {
	
	var apis = {};
	
	apis[SPAZCORE_SHORTURL_SERVICE_BITLY] = {
		'url'	  : 'http://api.bit.ly/v3/shorten',
		'getData' : function(longurl, opts) {
		    var data = {
		        'longurl':longurl,
		        'login':opts.login,
		        'apiKey':opts.apiKey,
		        'format':'json'
		    };
			return data;
		},
		'method':'GET',
		'processResult' : function(data) {
			var result = sc.helpers.deJSON(data);
			
			if (result.data && result.data.long_url) {
			    result.longurl = result.data.long_url;
    			result.shorturl = result.data.url;
			}
			return result;
		}
	};
		
	apis[SPAZCORE_SHORTURL_SERVICE_JMP] = {
		'url'	  : 'http://api.j.mp/v3/shorten',
		'getData' : function(longurl, opts){
		    var data = {
		        'longurl':longurl,
		        'login':opts.login,
		        'apiKey':opts.apiKey,
		        'format':'json'
		    };
			return data;
		},
		'method':'GET',
		'processResult' : function(data) {
			var result = sc.helpers.deJSON(data);
			
			if (result.data && result.data.long_url) {
			    result.longurl = result.data.long_url;
    			result.shorturl = result.data.url;
			}
			return result;
		}
	};
		
	apis[SPAZCORE_SHORTURL_SERVICE_ISGD] = {
		'url'	  : 'http://is.gd/create.php',
		'getData' : function(longurl, opts) {
			return { 'url':longurl, 'format':'simple' };
		}
	};
	
	apis[SPAZCORE_SHORTURL_SERVICE_GOOGLE] = {
		'url'	  : 'https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyBMFTY7VjWGoXeFwbiY7vXoqAssjTr0od0',
		// 'url'	  : 'https://www.googleapis.com/urlshortener/v1/url',
		'contentType':'application/json',
		'getData' : function(longurl, opts) {
			return JSON.stringify({ 'longUrl':longurl  });
		},
		'processResult' : function(data) {
			var result = sc.helpers.deJSON(data);
			result.longurl = result.longUrl;
			result.shorturl = result.id;
			return result;
		}
	};
	
	return apis[service];
};


/**
 * shortens a URL by making an ajax call
 * @param {string} longurl
 * @param {object} opts   right now opts.event_target (a DOMelement) and opts.apiopts (passed to api's getData() call) are supported
 */
SpazShortURL.prototype.shorten = function(longurl, opts) {
	
	var shortener = this;
	
	if (!opts) { opts = {}; }

	/*
		set defaults if needed
	*/
	opts.event_target = opts.event_target || document;
	opts.apiopts	  = opts.apiopts	  || null;



	if (sch.isString(longurl)) {
		longurl = [longurl];
	}
	
	
	for (var i=0; i < longurl.length; i++) {

		longurl[i];

	
		/*
			we call getData now in case it needs to override anything
		*/
		var apidata = this.api.getData(longurl[i], opts.apiopts);

		if (sc.helpers.getMojoURL) {
			this.api.url = sc.helpers.getMojoURL(this.api.url);
		}
		
		getShortURL(longurl[i], shortener, apidata, opts, this);
		
	}
	
	function getShortURL(longurl, shortener, apidata, opts, self) {
	    
		jQuery.ajax({
			'traditional':true, // so we don't use square brackets on arrays in data. Bit.ly doesn't like it
			'dataType':'text',
			complete:function(xhr, rstr) {
			},
			'error':function(xhr, msg, exc) {
				sc.helpers.dump(shortener.api.url + ' error:'+msg);

				var errobj = {'url':shortener.api.url, 'xhr':null, 'msg':null};

				if (xhr) {
					errobj.xhr = xhr;
					sc.helpers.error("Error:"+xhr.status+" from "+ shortener.api.url);
				} else {
					sc.helpers.error("Error:Unknown from "+ shortener.api.url);
					errobj.msg = 'Unknown Error';
				}
				shortener._onShortenResponseFailure(errobj, opts.event_target);
			},
			success:function(data) {
				// var shorturl = trim(data);
				var return_data = {};
				if (shortener.api.processResult) {
					return_data = shortener.api.processResult(data);
				} else {
					return_data = {
						'shorturl':data,
						'longurl' :longurl
					};
				}
				sch.error(return_data);
				shortener._onShortenResponseSuccess(return_data, opts.event_target);
			},

			'type':self.api.method || "POST",
			'contentType':self.api.contentType || "application/x-www-form-urlencoded",
			'url' :self.api.url,
			'data':apidata
		});			
	}
	
};

SpazShortURL.prototype._onShortenResponseSuccess = function(data, target) {
	sc.helpers.triggerCustomEvent(sc.events.newShortURLSuccess, target, data);
};
SpazShortURL.prototype._onShortenResponseFailure = function(errobj, target) {
	sc.helpers.triggerCustomEvent(sc.events.newShortURLFailure, target, errobj);
};

/**
 * @TODO 
 */
SpazShortURL.prototype.expand = function(shorturl, opts) {
	
	var shortener = this;
	var longurl;
	
	if (!opts) {
		opts = {};
	}
	
	opts.event_target = opts.event_target || document;
	
	/*
		Do a lookup in the cache first
	*/
	if ( (longurl = this.getExpandedURLFromCache()) ) {
		shortener._onExpandResponseSuccess({
				'shorturl':shorturl,
				'longurl' :longurl
			},
			opts.event_target
		);
		return;
	}
	
	/*
		if not cached, do query to look it up
	*/
	var xhr = jQuery.ajax({
    	'dataType':'text',
		complete:function(xhr, rstr) {
		},
		'error':function(xhr, msg, exc) {
			sc.helpers.dump(this.url + ' error:'+msg);
			
			var errobj = {'url':this.url, 'xhr':null, 'msg':null};
			
			if (xhr) {
				errobj.xhr = xhr;
				sc.helpers.dump("Error:"+xhr.status+" from "+ this.url);
			} else {
				sc.helpers.dump("Error:Unknown from "+ this.url);
				errobj.msg = 'Unknown Error';
			}
			shortener._onExpandResponseFailure(errobj, opts.event_target);
		},
		success:function(data) {
			// var shorturl = trim(data);
			data = sc.helpers.deJSON(data);
			var longurl = data[shorturl];
			
			/*
				save it to cache
			*/
			shortener.saveExpandedURLToCache(shorturl, longurl);
			
			shortener._onExpandResponseSuccess({
					'shorturl':shorturl,
					'longurl' :longurl
				},
				opts.event_target
			);
		},
		beforeSend:function(xhr) {},
		type:"GET",
		url :'http://longurlplease.appspot.com/api/v1.1',
		data:{ 'q':shorturl }
	});
};

/**
 * @TODO 
 */
SpazShortURL.prototype._onExpandResponseSuccess = function(data, target) {
	sc.helpers.triggerCustomEvent(sc.events.newExpandURLSuccess, target, data);
};

/**
 * @TODO 
 */
SpazShortURL.prototype._onExpandResponseFailure = function(errobj, target) {
	sc.helpers.triggerCustomEvent(sc.events.newExpandURLFailure, target, errobj);
};


SpazShortURL.prototype.findExpandableURLs = function(str) {
	var x, i, j, matches = [], key, thisdomain, thisregex, regexes = [];
	
	var all_urls = sch.extractURLs(str);
	
	for (i=0; i < SPAZCORE_EXPANDABLE_DOMAINS.length; i++) {
		thisdomain = SPAZCORE_EXPANDABLE_DOMAINS[i];
		if (thisdomain == 'ff.im') {
			regexes.push(new RegExp("http://"+thisdomain+"/(-?[a-zA-Z0-9]+)", "gi"));
		} else if (thisdomain == 'ow.ly') { // we have to skip ow.ly/i/XXX links
			regexes.push(new RegExp("http://"+thisdomain+"/(-?[a-zA-Z0-9]{2,})", "gi"));
		} else {
			regexes.push(new RegExp("http://"+thisdomain+"/([a-zA-Z0-9-_]+)", "gi"));
		}
		
	};
	
	sch.debug("looking for "+regexes+ " in '"+str+"'");
	for (i=0; i < regexes.length; i++) {
		thisregex = regexes[i];
		while( (re_matches = thisregex.exec(sch.trim(str))) != null) {
			matches.push(re_matches[0]);
		}		
	};
	
	sch.debug('Matches: '+matches);
	
	if (matches.length > 0) {
		return matches;
	} else {
		return null;
	}

};


SpazShortURL.prototype.expandURLs = function(urls, target) {
	for (var i=0; i < urls.length; i++) {
		var thisurl = urls[i];
		sch.dump('expanding '+thisurl);
		this.expand(thisurl, { 'event_target':target });
	};
};



/**
 * @param {string} str  the string to replace the URLs in
 * @param {string} shorturl 
 * @param {string} longurl 
 */
SpazShortURL.prototype.replaceExpandableURL = function(str, shorturl, longurl) {
	str = str.replace(shorturl, longurl, 'gi');
	/*
		we also expand the non-http://-prefixed versions. Wonder if this is a bad idea, though -- seems
		possible we could have unexpected consqeuences with this
	*/
	str = str.replace(shorturl.replace('http://', ''), longurl.replace('http://', ''), 'gi');
	return str;
};



SpazShortURL.prototype.getExpandedURLFromCache = function(shortURL) {
	return this.expanded_cache[shortURL];
};

SpazShortURL.prototype.saveExpandedURLToCache  = function(shortURL, longURL) {
	this.expanded_cache[shortURL] = longURL;
};