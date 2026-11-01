var List = {
	onload:function(){
		var ls = _P("ls","act");
		var topMenu = "Search";
		switch(ls){
			case "bkm":
			case "wls":
			case "blk":
			case "vtd":
				topMenu = "Profile";
			case "wsr":
			case "vtr":
			case "nvr":
				if(!KUI.chkLogin({nav:true})){
					return;
				}
				break;
			default:
				topMenu = "Search";
		}

		if( SSN.id ){
			TopTabs.showTab( "Menu." + topMenu );
			TopTabs.select( topMenu + "."+ ls );
		}else{
			TopTabs.select("GuestMenu.search");
		}

		document.title = _S("a.kobool") + " - " + _S("a.pg_title.list" ) + " - " + _S("a.pg_title." + ls) + KUI.SFilters2String() + " - " + _S("a.page") + ":" + (_N(_P("p",0)) + 1).toString();

		var pr = _R( KUI.blockedEl("ListRoot") );
		var root = _A( _CL("Contents"), "div", {}, pr );
		var ps = _P( "ps",_GC("ps","5") );
		Http.getCGI( gCGI.search, 
			PgNav.searchParams({ps:ps}),
			function(response){
				_CL(root);//remove progress
				_SA(root,{id:"ListRoot"});
				_H("Debug",response);
				var results=JSN(response);
				if(results.error){
					KUI.msgbox("errors:error." + results.error);
				}else{
					List.results = results;
					_A(_A(root,"div",{"class":"pg_header"}), KUI.renderSFilters( {res:results}) );
					_A(root, List.sortBar());
					if( _N(results.total) ){
						_A( root, List.render(results, ls, ps) );
					}else{
						_A(root, "div", {"class":"pg_body subtitle"}, _S("a.no_results"));
					}
				}
			}
		);	
	},
	
	render:function( results, ls, ps ){
		var ret = _C("div",{"class":"pg_body", "ls":ls});

		RSCR("MemVUR.vw" + ps ,function(){
			Enum( results.child_list, function(child){
				ret.appendChild( MemVUR["vw"+ps].render(child) );
			});
			_A( ret, KUI.renderNav(results));
		});
		return ret;
	},
/*
	next:function(){
		var pg = _N( PgNav.getCParam("p",0) );
		if( ((pg+1)*_N(this.results.page_size))<_N(this.results.total) ){
			this.gotoPage(pg+1);
		}
	},
	prev:function(){
		var pg = _N( PgNav.getCParam("p",0) );
		if(pg>0){
			this.gotoPage(pg-1);
		}
	},
	gotoPage:function(n){
		PgNav.nav2CParam("p",n);
	},
*/

	openItem:function(id,params){
		if(_D(params)){
			params.mem = id;
		}else{
			params = {"mem":id};
		}
		PgNav.open("mem", params);
	},
	sortBar:function(){
		var re = _C("div",{"class":"sort_bar"});

		var ls = _P("ls","act");
		var lsc = {
			act:{cols:"ch:m,ob:rl,ob:rm,ob:ag", def:"rl"},
			blk:{cols:"ch:m,ob:rl,ob:rm,ob:ag", def:"rl"},
			bkm:{cols:"ch:m,ob:rl,ob:rm,ob:ag,ch:bl", def:"rl"},
			vtr:{cols:"ch:m,ob:rl,ob:rm,ob:rv,ob:mv,ob:ag,ch:bl", def:"rv"},
			vtd:{cols:"ch:m,ob:rl,ob:rm,ob:rv,ob:mv,ob:ag,ch:bl", def:"rv"},
			nvr:{cols:"ch:m,ob:rl,ob:rm,ob:rv,ob:mv,ob:ag,ch:bl", def:"rv"},
			wls:{cols:"ch:m,ob:ra,ob:rl,ob:rm,ob:ag",def:"ra"},
			wsr:{cols:"ch:m,ob:ra,ob:rl,ob:rm,ob:ag,ch:bl,ch:mu",def:"rv"}
		};
		if(!_D(lsc[ls])){
			ls = "act";
		}
		Enum(lsc[ls].cols.split(","), function(item){
			var cInfo = item.split(":");
			if(cInfo[0] == "ch"){
				var sel = _P(cInfo[1])=="1" ? "checked" : "";
				_A(re,"span",{"class":"small sort_chk " + sel},_S("sort." + cInfo[1])).onclick=function(){
					var p={};p[cInfo[1]]=(sel.length>0)?null:1;
					PgNav.chgParams(p,["p"]);
				};
			}else{
				var sel = _P("ob",lsc[ls].def) == cInfo[1] ? "sel" : "";
				_A(re,"span",{"class":"small sort_btn " + sel},_S("sort." + cInfo[1])).onclick=function(){
					PgNav.chgParams({ob:cInfo[1]},["p"]);
				};
			}
		});

		var cvw = _P( "ps",_GC("ps","5") );
		Enum(["5","10","25"],function(item){
			var sel = (cvw == item)?" sel" : "";
			_A(re, "span", {"class":"btn vw" + item + sel} ).onclick=function(){
				_SC("ps",item,true);
				PgNav.chgParams({ps:item},["p"]);
			};
		});

		return re;
	}
};

