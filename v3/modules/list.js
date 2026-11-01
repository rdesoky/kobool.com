/**
 * Created by rdeso_000 on 1/6/2015.
 */
define(["jquery","page-nav", "kui", "k-template", "http","utils","dom-utils","top-tabs", "js-promise"],function($,pgNav, kui, ktmpl, http, $u, $du, $tabs, Promise){
	var module;
	
	return module = {
		requireCSS:["list"],
		requireStrings:["options:sfilters","str:filters_title","str:sort", "qa:ui","str:q"],

		onchange:function(){
			this.onload();
			pgNav.scrollTop();
		},

		onload:function(){
			var ls = _P("ls","act");
			var topMenu = "Search";
			switch(ls){
				case "bkm": case "wls": case "blk": case "vtd":
					topMenu = "Profile";
				case "wsr": case "vtr": case "nvr":
					if(!kui.chkLogin({nav:true})){
						return;
					}
					break;
				default:
					topMenu = "Search";
			}

			if( SSN.id ){
				$tabs.showTab( "Menu." + topMenu );
				$tabs.select( topMenu + "."+ ls );
			}else{
				$tabs.select("GuestMenu.search");
			}

			$("#PageActions").html(_S("a.pg_title." + ls));

			document.title = _S("a.kobool") +
							" - " + _S("a.pg_title.list" ) +
							" - " + _S("a.pg_title." + ls) + kui.SFilters2String() +
							" - " + _S("a.page") + ":" + (_N(_P("p",0)) + 1).toString();

			var $sresults= $("#SResults").html("").append("<div class='progress'/>");
			var $filters = $("#SearchFilters");
			var $sort_bar = $("#SortBar");
			var $total = $("#SearchTotal");

			var ps = _P( "ps",_GC("ps","5") );


			this.getPage(0).done(function(pageInfo){
				var results = pageInfo.results;
				$total.html(results.total);
				$sort_bar.html("").append(module.sortBar());
				$filters.html("").append(kui.renderSFilters( {res:pageInfo.results}));
				$sresults.html("");
				if( _N(results.total) ) {
					$sresults.append(pageInfo.$docFrag);
				}else{
					$sresults.append("<div class='subtitle'>" + _S("a.no_results") + "</div>");
				}
			});
		},

		getPage:function(page){

			var $docFrag = $(document.createDocumentFragment());
			var results;

			return http.getCGI( http.api.search, $u.searchParams({p:page, ps:10}) )
				.then( function(http){
					results=JSN(http.responseText);
					if(results.error){
						$docFrag.append($('<div>' + _S("errors:error." + results.error) + '</div>'));
						return Promise.as($docFrag.dom());
					}else{
						return ktmpl.render({
							$root:$docFrag,
							tid:".sresult_item_frame",
							data:results.child_list,
							ordinal:page*10+1,
							puller:function(){
								return module.getPage(page + 1);
							}
						});
					}
				}).then(function(){
					//check for duplicate members
					return {
						$docFrag:$docFrag,
						results:results
					}
				});

		},

		openItem:function(id,params){
			if(_D(params)){
				params.mem = id;
			}else{
				params = {"mem":id};
			}
			pgNav.open("mem", params);
		},

		sortBar:function(){
			var re = _C("ul",{"class":"sort_bar"});

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
			$.each(lsc[ls].cols.split(","), function(item){
				var cInfo = item.split(":");
				if(cInfo[0] == "ch"){
					var sel = _P(cInfo[1])=="1" ? "checked" : "";
					_A(re,"li",{"class":"small sort_chk " + sel},_S("sort." + cInfo[1])).onclick=function(){
						var p={};p[cInfo[1]]=(sel.length>0)?null:1;
						pgNav.chgParams(p,["p"]);
					};
				}else{
					var sel = _P("ob",lsc[ls].def) == cInfo[1] ? "sel" : "";
					_A(re,"li",{"class":"small sort_btn " + sel},_S("sort." + cInfo[1])).onclick=function(){
						pgNav.chgParams({ob:cInfo[1]},["p"]);
					};
				}
			});

			//var viewtypes = _AD(re,{"class":"view_types"});
			//var cvw = _P( "ps",_GC("ps","5") );
			//Enum(["5","10","25"],function(item){
			//	var sel = (cvw == item)?" sel" : "";
			//	_A(viewtypes, "span", {"class":"btn vw" + item + sel} ).onclick=function(){
			//		_SC("ps",item,true);
			//		pgNav.chgParams({ps:item},["p"]);
			//	};
			//});

			return re;
		}
	}	
});
