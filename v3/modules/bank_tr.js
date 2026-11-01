/**
 * Created by rdeso_000 on 1/15/2015.
 */
define(["jquery", "top-tabs", "page-nav", "str-loader", "kui", "cpoints"], function($, $tabs, $pgNav, $strLoader, $kui, $cpoints){

	return {
		requireCSS:["cpoints"],
		requireStrings:["cpoints:bank_tr"],
		onload:function(){
			$tabs.showTab("Menu.CPoints");
			$tabs.select("CP.buy");
		}
	};
});
