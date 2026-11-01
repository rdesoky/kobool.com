/**
 * Created by rdeso_000 on 1/8/2015.
 *
 * Adapter over shared/strings.js.
 *
 * The legacy module read strings out of hidden ClientStrings <div>s that the
 * server rendered. Those are gone: bundles are now compiled to JSON and owned
 * by window.KStrings, so every entry point here delegates to it while keeping
 * the original signatures and promise semantics.
 */
define(["js-promise","http","utils","shortcuts"],function(CPromise,http,$u,_){

	function normalize(strID){
		return strID.indexOf(":") === -1 ? "str:" + strID : strID;
	}

	var self = {
		requireArrayOfStrings: function ( arr, callback ){//Require Array of String Resources
			var pr_list = [];
			for(var i=0;i<arr.length;i++){
				pr_list.push( this.requireStrings(arr[i]) )
			}
			return CPromise.all(pr_list).then(callback);
		},
		requireStrings: function( path, callback ){// Require String resource
			//sample: RS("qa:ui",function(){_H(state,_S("qa:ui.message"))});
			if( _E( path ) ){
				if (callback) {
					callback();
				}
				return new CPromise.as(true);
			}
			var aPath = path.split(":");
			var src = aPath.length > 1 ? aPath[0] : "str";

			// KStrings returns a native Promise; callers (and CPromise.all)
			// expect the legacy CPromise interface, so bridge it here.
			var deferred = new CPromise();
			window.KStrings.loadBundle( src ).then( function(){
				if (callback) {
					callback();
				}
				deferred.resolve(true);
			}, function(err){
				deferred.reject(err);
			});
			return deferred;
		},

		getString:function(strID, defVal){
			return window.KStrings.getString(normalize(strID), defVal);
		},

		getStringAsync:function(strID, defVal){
			if ( strID.indexOf("undefined") != -1 ) {
				return "";
			}
			var strBase = strID.substring(0, strID.indexOf(".") );
			if( -1 == strBase.indexOf(":") ){
				strBase = "str:" + strBase;
			}

			return self.requireStrings( strBase ).then( function(){
				return self.getString(strID, defVal);
			});
		},

		setHTML: function(el, strID, onload){
			el = _E(el);
			if( (typeof strID != "string") || !strID.length ){
				return _A(el,strID);
			}
			var strBase = strID.substring(0, strID.indexOf(".") );
			if( -1 == strBase.indexOf(":") ){
				strBase = "str:" + strBase;
			}

			_H(el,"&nbsp;");

			function setTxt(txt){
				switch(el.tagName){
					case "input":
					case "textarea":
						el.value = txt;
						break;
					default:
						el.innerHTML = txt;
				}
			}
			setTxt("&nbsp;");

			self.requireStrings( strBase, function(){
				var strVal = self.getString(strID);
				if(onload) {
					var ret = onload(strVal);
					if(ret !== undefined){// processed by caller
						strVal = ret;
					}
				}
				setTxt(strVal);
			});

			return el;
		}

	};

	window.RAS = self.requireArrayOfStrings;
	window.RS = self.requireStrings;

	window._S = self.getString;
	window._PS = self.getStringAsync;
	window._HS = self.setHTML;

	return self;

});
