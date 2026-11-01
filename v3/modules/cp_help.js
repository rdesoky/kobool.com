/**
 * Created by rdeso_000 on 1/16/2015.
 */
define(["top-tabs", "kui"],function($tabs, $kui){
	return {
		onload:function(){
			$tabs.showTab("Menu.CPoints");
			$tabs.select("CP.help");
			_HS( _A("Contents","div",{"class":"pg_header title"} ) , "cpoints:qa.title" );
			_HS( _A("Contents","div",{id:"CPiontsEUALText","class":"pg_body"}, $kui.getProgress()), "cpoints:qa.contents" );
		}
	};
});
