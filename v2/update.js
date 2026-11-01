var Update = {
	onload:function(){
		if( !KUI.chkLogin({nav:true}) ){
			return;
		}
		TopTabs.showTab("Menu.Update");
		TopTabs.select(null);
		this.showOptions();
	},
	showOptions:function(){

		_A("Contents", "div", {"class":"pg_header title"},_S("profile.select_update") );

		var root = _A( "Contents", "div", {"class":"pg_body"} );
		
		var lst = _A(root, "dl", {id:"UpdateBtns"});

		Enum( {	upd_attr:"update_attr",
				upd_txt:"update_text",
				upd_pics: "update_pics",
				upd_pass: "update_pass",
				upd_email: "update_email",
				acc_suspend: "stop_account",
				acc_activate: "activate_account"
			}, 
			function( val, key ){
				if( key=="acc_suspend" && !SSN.activated ){
				}else if( key=="acc_activate" && SSN.activated ){
				}else{
					_A( lst, "li", {"class":"drill_btn update_btn"}, _S("profile." + val) ).onclick = function(){
						PgNav.open(key,undef,true);
					};
				}
			}
		);

		_A( root, "input", {type:"button", value:_S("a.show_my_page")} ).onclick=function(){
			PgNav.open("mem", {mem:false}, true);
		};
	}
};