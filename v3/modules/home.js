/**
 * Created by rdeso_000 on 1/6/2015.
 */

define(["jquery","page-nav","top-tabs","register"],function($, $pgNav,$tabs){
	return {
		requireCSS:["home"],
		onload:function(){
			$tabs.select( "GuestMenu.home" );
			$("#PageActions").html(_S("a.welcome"));
			$("#BtnRegister").click(function(){

			});

			if(SSN.id){
				$pgNav.open("my",undefined,undefined,true);
			}else{
				//TopTabs.select("HeaderLogo");
			}
		}
	}
});