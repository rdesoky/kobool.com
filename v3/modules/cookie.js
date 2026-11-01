/**
 * Created by rdeso_000 on 1/4/2015.
 */

define(["page-nav", "utils"], function(PgNav, U){
	return {
		Get: function () {
			return PgNav.getCookie.apply(PgNav, arguments);
		},
		nGet: function () {
			return parseInt(PgNav.getCookie.apply(PgNav, arguments), 10);
		},
		Set:function(){
			return U.setCookie.apply(U,arguments);
		}
	}
});