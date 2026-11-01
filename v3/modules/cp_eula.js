/**
 * Created by rdeso_000 on 1/15/2015.
 */
define(["top-tabs", "page-nav", "str-loader","kui"],function($tabs, $pgNav, $strLoader, $kui){

	return {
		requireStrings:["cpoints:ui"],
		onload:function(){
			$tabs.showTab("Menu.CPoints");
			$tabs.select("CP.eula");
			$strLoader.requireStrings("cpoints:ui");
			_HS( _A( "Contents","div",{"class":"pg_header title"} ), "cpoints:eula.title" );
			var txt = _A( "Contents","div",{id:"CPiontsEUALText", "class":"pg_body"} );
			_HS( _A(txt,"div",{}, $kui.getProgress()), "cpoints:eula.contents" );
			var back = _P("back");
			if(back){
				var ln = _A(txt,"center");
				_A( ln, "input", {type:"button", value: _S("cpoints:ui.accept")} ).onclick=function(){
					$pgNav.open(back,{accept:1});
				};
				_A( ln, "input", {type:"button", value: _S("cpoints:ui.back")} ).onclick=function(){
					$pgNav.open(back,undefined,["accept"]);
				};
			}
		}
	}
});
